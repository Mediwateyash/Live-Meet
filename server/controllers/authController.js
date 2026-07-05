import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } from '../utils/generateToken.js'
import { sendEmail }   from '../config/nodemailer.js'
import { validatePassword } from '../utils/passwordValidator.js'

// ── In-memory access token blacklist (15-min TTL matches token expiry) ────────
const tokenBlacklist = new Map()  // token → expiresAt (ms)
const BLACKLIST_TTL  = 15 * 60 * 1000

export function isTokenBlacklisted(token) {
  const expiresAt = tokenBlacklist.get(token)
  if (!expiresAt) return false
  if (Date.now() > expiresAt) { tokenBlacklist.delete(token); return false }
  return true
}

// Periodically prune expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [t, exp] of tokenBlacklist) {
    if (now > exp) tokenBlacklist.delete(t)
  }
}, 5 * 60 * 1000)
// ─────────────────────────────────────────────────────────────────────────────

export async function register(req, res, next) {
  try {
    let { fullName, email, password, role } = req.body
    if (!fullName || !email || !password) throw new ApiError(400, 'All fields required')

    fullName = fullName.trim()
    email = email.trim().toLowerCase()
    password = password.trim()

    validatePassword(password)

    const exists = await User.findOne({ email })
    if (exists) throw new ApiError(409, 'Account creation failed. Please try again or use a different email.')

    if (role && !['student', 'instructor'].includes(role)) throw new ApiError(400, 'Invalid role')

    const user = await User.create({ fullName, email, password, role: role || 'student' })
    const accessToken  = generateAccessToken(user._id, user.role)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    setTokenCookies(res, accessToken, refreshToken)

    const { password: _, refreshToken: __, ...userData } = user.toObject()
    res.status(201).json(new ApiResponse(201, userData, 'Registration successful'))
  } catch (err) { next(err) }
}

export async function login(req, res, next) {
  try {
    let { email, password } = req.body
    if (!email || !password) throw new ApiError(400, 'Email and password required')

    email = email.trim().toLowerCase()
    password = password.trim()

    const user = await User.findOne({ email }).select('+password')
    if (!user) throw new ApiError(401, 'Invalid credentials')

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new ApiError(423, 'Account is temporarily locked. Please try again later.')
    }

    const valid = await user.comparePassword(password)
    if (!valid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes lockout
      }
      await user.save({ validateBeforeSave: false })
      throw new ApiError(401, 'Invalid credentials')
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockUntil = undefined

    const accessToken  = generateAccessToken(user._id, user.role)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    setTokenCookies(res, accessToken, refreshToken)

    const { password: _, refreshToken: __, ...userData } = user.toObject()
    res.json(new ApiResponse(200, userData, 'Login successful'))
  } catch (err) { next(err) }
}

export async function logout(req, res, next) {
  try {
    // Blacklist the current access token to prevent replay attacks
    const token = req.cookies?.accessToken
    if (token) {
      tokenBlacklist.set(token, Date.now() + BLACKLIST_TTL)
    }
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } })
    }
    clearTokenCookies(res)
    res.json(new ApiResponse(200, null, 'Logged out'))
  } catch (err) { next(err) }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken
    if (!token) throw new ApiError(401, 'No refresh token')

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user    = await User.findById(decoded.userId).select('+refreshToken')
    if (!user) throw new ApiError(401, 'Invalid refresh token')

    if (user.refreshToken !== token) {
      // Stolen/reused refresh token detected! Revoke current refresh token to block access.
      user.refreshToken = undefined
      await user.save({ validateBeforeSave: false })
      clearTokenCookies(res)
      throw new ApiError(401, 'Suspicious activity detected. Please login again.')
    }

    const accessToken  = generateAccessToken(user._id, user.role)

    // Reuse the existing validated refresh token to avoid concurrent race conditions during dashboard loads
    setTokenCookies(res, accessToken, token)
    res.json(new ApiResponse(200, null, 'Tokens refreshed'))
  } catch (err) { next(err) }
}

export async function getMe(req, res, next) {
  try {
    res.json(new ApiResponse(200, req.user))
  } catch (err) { next(err) }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.json(new ApiResponse(200, null, 'If the email exists, a reset link was sent'))
    }

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + 60 * 60 * 1000

    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'Secure key not configured on server')
    }
    // Invalidate any existing reset tokens
    await User.updateOne(
      { _id: user._id },
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
    )

    const RESET_SECRET = process.env.JWT_SECRET + (process.env.JWT_REFRESH_SECRET || '')
    user.resetPasswordToken   = crypto.createHmac('sha256', RESET_SECRET).update(token).digest('hex')
    user.resetPasswordExpires = expires
    await user.save({ validateBeforeSave: false })

    // Send token as a URL fragment so it never appears in server logs or Referer headers
    const resetURL = `${process.env.CLIENT_URL}/reset-password#token=${token}`
    await sendEmail({
      to: email,
      subject: 'Password Reset — Zenius AI',
      html: `
<p>You requested a password reset.</p>
<p>Click the link below to reset your password (valid for 1 hour):</p>
<p><a href="${resetURL}" style="color:#1a73e8;font-size:16px;">Reset Your Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
`,
    })

    res.json(new ApiResponse(200, null, 'Reset link sent'))
  } catch (err) { next(err) }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body
    if (!token) throw new ApiError(400, 'Token required')
    validatePassword(password)

    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'Secure key not configured on server')
    }
    const RESET_SECRET = process.env.JWT_SECRET + (process.env.JWT_REFRESH_SECRET || '')
    const hashed = crypto.createHmac('sha256', RESET_SECRET).update(token).digest('hex')
    const user   = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) throw new ApiError(400, 'Invalid or expired reset token')

    user.password             = password
    user.resetPasswordToken   = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    clearTokenCookies(res)
    res.json(new ApiResponse(200, null, 'Password reset successful'))
  } catch (err) { next(err) }
}
