import jwt from 'jsonwebtoken'

export function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1d' })
}

export function setTokenCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production'

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'strict',
    maxAge:   15 * 60 * 1000,
    path:     '/api',
  })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'strict',
    maxAge:   1 * 24 * 60 * 60 * 1000, // 1 day
    path:     '/api/auth/refresh',
  })
}

export function clearTokenCookies(res) {
  res.clearCookie('accessToken', { path: '/api' })
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' })
}
