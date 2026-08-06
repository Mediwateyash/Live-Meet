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
    if (exists) {
      if (!exists.isEmailVerified) {
        throw new ApiError(409, 'Account exists but email is not verified. Please verify your email or resend the code.')
      }
      throw new ApiError(409, 'Account creation failed. Please try again or use a different email.')
    }

    if (role && !['student', 'instructor'].includes(role)) throw new ApiError(400, 'Invalid role')

    const user = await User.create({ fullName, email, password, role: role || 'student' })
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const OTP_SECRET = process.env.JWT_SECRET + (process.env.JWT_REFRESH_SECRET || '')
    const hashedOTP = crypto.createHmac('sha256', OTP_SECRET).update(otp).digest('hex')

    user.emailVerificationOTP = hashedOTP
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
    await user.save({ validateBeforeSave: false })

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email — Zenius AI',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #F5F3FF; border-radius: 16px;">
            <h2 style="color: #7C3AED; font-family: Outfit, sans-serif;">Welcome to Zenius AI!</h2>
            <p style="color: #1E1B4B; line-height: 1.7;">Your email verification code is:</p>
            <div style="background: #E0E7FF; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <strong style="color: #4338CA; font-size: 24px; letter-spacing: 4px;">${otp}</strong>
            </div>
            <p style="color:#64748B; line-height:1.7;">This code will expire in 10 minutes.</p>
            <p style="margin-top: 24px; color: #64748B; font-size: 13px;">— The Zenius AI Team</p>
          </div>
        `,
      })
    } catch (emailError) {
      // Clean up the user if email failed to send, so they aren't stuck in an unverified state
      await User.findByIdAndDelete(user._id)
      console.error('Email sending failed:', emailError)
      throw new ApiError(500, 'Failed to send verification email. Please check the email server configuration.')
    }

    res.status(201).json(new ApiResponse(201, { email: user.email }, 'Verification OTP sent to your email.'))
  } catch (err) { next(err) }
}

export async function verifyEmail(req, res, next) {
  try {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(400, 'Email and OTP required')

    email = email.trim().toLowerCase()
    otp = otp.trim()

    const OTP_SECRET = process.env.JWT_SECRET + (process.env.JWT_REFRESH_SECRET || '')
    const hashedOTP = crypto.createHmac('sha256', OTP_SECRET).update(otp).digest('hex')

    const user = await User.findOne({
      email,
      emailVerificationOTP: hashedOTP,
      emailVerificationExpires: { $gt: Date.now() },
    })

    if (!user) throw new ApiError(400, 'Invalid or expired OTP')

    // Mark as verified
    user.isEmailVerified = true
    user.emailVerificationOTP = undefined
    user.emailVerificationExpires = undefined

    const accessToken  = generateAccessToken(user._id, user.role)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    setTokenCookies(res, accessToken, refreshToken)

    const { password: _, refreshToken: __, ...userData } = user.toObject()
    res.json(new ApiResponse(200, userData, 'Email verified successfully! You are now logged in.'))
  } catch (err) { next(err) }
}

export async function resendVerification(req, res, next) {
  try {
    let { email } = req.body
    if (!email) throw new ApiError(400, 'Email required')
    
    email = email.trim().toLowerCase()
    const user = await User.findOne({ email })
    
    if (!user) {
      return res.json(new ApiResponse(200, null, 'If the email exists, an OTP was sent.'))
    }
    if (user.isEmailVerified) {
      throw new ApiError(400, 'Email is already verified.')
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const OTP_SECRET = process.env.JWT_SECRET + (process.env.JWT_REFRESH_SECRET || '')
    const hashedOTP = crypto.createHmac('sha256', OTP_SECRET).update(otp).digest('hex')

    user.emailVerificationOTP = hashedOTP
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000
    await user.save({ validateBeforeSave: false })

    await sendEmail({
      to: email,
      subject: 'Verify your email — Zenius AI',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #F5F3FF; border-radius: 16px;">
          <h2 style="color: #7C3AED; font-family: Outfit, sans-serif;">Email Verification</h2>
          <p style="color: #1E1B4B; line-height: 1.7;">Your new verification code is:</p>
          <div style="background: #E0E7FF; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <strong style="color: #4338CA; font-size: 24px; letter-spacing: 4px;">${otp}</strong>
          </div>
          <p style="color:#64748B; line-height:1.7;">This code will expire in 10 minutes.</p>
          <p style="margin-top: 24px; color: #64748B; font-size: 13px;">— The Zenius AI Team</p>
        </div>
      `,
    })

    res.json(new ApiResponse(200, { email: user.email }, 'Verification OTP resent.'))
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
    if (user.role !== 'admin' && user.lockUntil && user.lockUntil > Date.now()) {
      throw new ApiError(423, 'Account is temporarily locked. Please try again later.')
    }

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Email not verified. Please verify your email first.')
    }

    const valid = await user.comparePassword(password)
    if (!valid) {
      // Increment login attempts
      if (user.role !== 'admin') {
        user.loginAttempts = (user.loginAttempts || 0) + 1
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes lockout
        }
        await user.save({ validateBeforeSave: false })
      }
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
