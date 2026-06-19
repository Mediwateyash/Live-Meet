import { ApiError } from './ApiError.js'

export function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long')
  }
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    throw new ApiError(
      400,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
  }
}
