import User from '../models/User.js'
import Course from '../models/Course.js'
import mongoose from 'mongoose'
import InstructorRequest from '../models/InstructorRequest.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { validatePassword } from '../utils/passwordValidator.js'
import { uploadBase64Image } from '../utils/cloudinaryUpload.js'
import { clearTokenCookies } from '../utils/generateToken.js'

export async function getProfile(req, res, next) {
  try {
    // Check authorization BEFORE querying DB to prevent user enumeration
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied')
    }
    let selectFields = '-password -refreshToken -resetPasswordToken -resetPasswordExpires';
    if (req.user._id.toString() !== req.params.id) {
      selectFields += ' -enrolledCourses -wishlist';
    }
    const user = await User.findById(req.params.id).select(selectFields)
    if (!user) throw new ApiError(403, 'Access denied')
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

    const uploadedAvatar = await uploadBase64Image(avatar, 'zenius/avatars')

    const update = { fullName, bio, avatar: uploadedAvatar, linkedin, portfolio, phone, department }
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

    // Prevent duplicate applications: Check if an instructor request already exists for this user
    const existingRequest = await InstructorRequest.findOne({ user: user._id })
    if (existingRequest) {
      throw new ApiError(409, 'You have already submitted an instructor application.')
    }

    const {
      phone,
      country,
      department,
      qualification,
      occupation,
      organization,
      experience,
      expertise,
      teachingMode,
      languages,
      bio,
      motivation,
      linkedin,
      portfolio,
      resume,
    } = req.body

    const request = await InstructorRequest.create({
      user: user._id,
      fullName: req.body.fullName || user.fullName,
      email:    req.body.email || user.email,
      phone,
      country: country || 'India',
      department,
      qualification,
      occupation,
      organization,
      experience,
      expertise,
      teachingMode,
      languages,
      bio,
      motivation,
      linkedin,
      portfolio,
      resume,
    })

    await User.findByIdAndUpdate(user._id, { instructorRequestStatus: 'pending' })
    res.status(201).json(new ApiResponse(201, request, 'Application submitted'))
  } catch (err) { next(err) }
}

export async function getRequestStatus(req, res, next) {
  try {
    const request = await InstructorRequest
      .findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('status fullName department experience createdAt reviewedAt rejectionReason')
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
    const courseId = req.params.courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID')
    }

    const courseExists = await Course.exists({ _id: courseId })
    if (!courseExists) {
      throw new ApiError(404, 'Course not found')
    }

    const user = await User.findById(req.user._id).select('wishlist')
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const isWishlisted = user.wishlist.some(id => id.toString() === courseId.toString())
    const updateQuery = isWishlisted 
      ? { $pull: { wishlist: courseId } } 
      : { $addToSet: { wishlist: courseId } }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateQuery,
      { new: true, select: 'wishlist' }
    )

    res.json(new ApiResponse(200, updatedUser.wishlist, 'Wishlist updated'))
  } catch (err) { next(err) }
}


export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new passwords are required')
    }
    validatePassword(newPassword)

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

export async function deleteProfile(req, res, next) {
  try {
    const userId = req.user._id
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    if (user.role === 'admin') {
      throw new ApiError(400, 'Admin accounts cannot be deleted directly')
    }

    await User.findByIdAndDelete(userId)
    clearTokenCookies(res)

    res.json(new ApiResponse(200, null, 'Account deleted permanently'))
  } catch (err) { next(err) }
}

