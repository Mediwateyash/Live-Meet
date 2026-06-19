import User from '../models/User.js'
import InstructorRequest from '../models/InstructorRequest.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function getProfile(req, res, next) {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied')
    }
    const user = await User.findById(req.params.id).select('-password -refreshToken -resetPasswordToken')
    if (!user) throw new ApiError(404, 'User not found')
    res.json(new ApiResponse(200, user))
  } catch (err) { next(err) }
}

export async function updateProfile(req, res, next) {
  try {
    const { fullName, bio, avatar, linkedin, portfolio, phone, department } = req.body
    // expertise may come as a comma-separated string from the form or as an array
    const raw = req.body.expertise
    const expertise = Array.isArray(raw)
      ? raw
      : typeof raw === 'string' && raw.trim()
        ? raw.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    const update = { fullName, bio, avatar, linkedin, portfolio, phone, department }
    if (expertise !== undefined) update.expertise = expertise
    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken')
    res.json(new ApiResponse(200, user, 'Profile updated'))
  } catch (err) { next(err) }
}

export async function becomeInstructor(req, res, next) {
  try {
    const user = req.user
    if (user.role === 'instructor') throw new ApiError(400, 'Already an instructor')
    if (user.instructorRequestStatus === 'pending') throw new ApiError(400, 'Application already pending')

    const { phone, department, expertise, motivation, linkedin, portfolio } = req.body

    const request = await InstructorRequest.create({
      user: user._id,
      fullName: user.fullName,
      email:    user.email,
      phone, department, expertise, motivation, linkedin, portfolio,
    })

    await User.findByIdAndUpdate(user._id, { instructorRequestStatus: 'pending' })
    res.status(201).json(new ApiResponse(201, request, 'Application submitted'))
  } catch (err) { next(err) }
}

export async function getRequestStatus(req, res, next) {
  try {
    const request = await InstructorRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(new ApiResponse(200, request))
  } catch (err) { next(err) }
}

export async function getEnrolled(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'enrolledCourses', select: 'title slug thumbnail instructor avgRating reviewCount price isFree totalDuration totalLessons enrolledStudents', populate: { path: 'instructor', select: 'fullName' } })
    res.json(new ApiResponse(200, user.enrolledCourses || []))
  } catch (err) { next(err) }
}

export async function getWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'wishlist', select: 'title slug thumbnail instructor avgRating reviewCount price isFree totalDuration totalLessons enrolledStudents', populate: { path: 'instructor', select: 'fullName' } })
    res.json(new ApiResponse(200, user.wishlist || []))
  } catch (err) { next(err) }
}

export async function toggleWishlist(req, res, next) {
  try {
    const user     = await User.findById(req.user._id)
    const courseId = req.params.courseId
    const idx      = user.wishlist.findIndex(id => id.toString() === courseId.toString())
    if (idx > -1) {
      user.wishlist.splice(idx, 1)
    } else {
      user.wishlist.push(courseId)
    }
    await user.save({ validateBeforeSave: false })
    res.json(new ApiResponse(200, user.wishlist, 'Wishlist updated'))
  } catch (err) { next(err) }
}

export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new passwords are required')
    }
    if (newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters')
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) throw new ApiError(404, 'User not found')

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new ApiError(400, 'Incorrect current password')
    }

    user.password = newPassword
    await user.save()

    res.json(new ApiResponse(200, null, 'Password updated successfully'))
  } catch (err) { next(err) }
}

