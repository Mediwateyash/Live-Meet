import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } from '../utils/generateToken.js'
import { sendEmail }   from '../config/nodemailer.js'

export async function register(req, res, next) {
  try {
    let { fullName, email, password } = req.body
    if (!fullName || !email || !password) throw new ApiError(400, 'All fields required')

    fullName = fullName.trim()
    email = email.trim().toLowerCase()
    password = password.trim()

    const exists = await User.findOne({ email })
    if (exists) throw new ApiError(409, 'Email already registered')

    const user = await User.create({ fullName, email, password })
    const accessToken  = generateAccessToken(user._id)
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

    const valid = await user.comparePassword(password)
    if (!valid) throw new ApiError(401, 'Invalid credentials')

    const accessToken  = generateAccessToken(user._id)
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
    if (!user || user.refreshToken !== token) throw new ApiError(401, 'Invalid refresh token')

    const accessToken  = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    setTokenCookies(res, accessToken, refreshToken)
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

    user.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex')
    user.resetPasswordExpires = expires
    await user.save({ validateBeforeSave: false })

    const resetURL = `${process.env.CLIENT_URL}/reset-password#token=${token}`
    await sendEmail({
      to: email,
      subject: 'Password Reset — Zenius AI',
      html: `<p>Reset your password: <a href="${resetURL}">${resetURL}</a> (valid for 1 hour)</p>`,
    })

    res.json(new ApiResponse(200, null, 'Reset link sent'))
  } catch (err) { next(err) }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body
    if (!token) throw new ApiError(400, 'Token required')
    if (!password || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters')

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
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
