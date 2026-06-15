import jwt from 'jsonwebtoken'

export function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function setTokenCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge:   15 * 60 * 1000,
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/api/auth/refresh',
  })
}

export function clearTokenCookies(res) {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' })
}
