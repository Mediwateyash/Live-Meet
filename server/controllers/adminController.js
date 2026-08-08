import User               from '../models/User.js'
import Course             from '../models/Course.js'
import InstructorRequest  from '../models/InstructorRequest.js'
import Setting            from '../models/Setting.js'
import { ApiError }       from '../utils/ApiError.js'
import { ApiResponse }    from '../utils/ApiResponse.js'
import { sendEmail, approvalEmail, rejectionEmail } from '../config/nodemailer.js'
import { uploadBase64Image } from '../utils/cloudinaryUpload.js'

export async function getDashboard(req, res, next) {
  try {
    const [totalUsers, totalCourses, totalInstructors, pendingRequests] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ role: 'instructor', isApprovedInstructor: true }),
      InstructorRequest.countDocuments({ status: 'pending' }),
    ])
    res.json(new ApiResponse(200, { totalUsers, totalCourses, totalInstructors, monthlyEnrollments: 0, pendingRequests, signupChart: [], enrollChart: [] }))
  } catch (err) { next(err) }
}

export async function getRequests(req, res, next) {
  try {
    const { status = 'pending' } = req.query
    // Get requests from InstructorRequest collection
    const requests = await InstructorRequest.find({ status }).sort({ createdAt: -1 }).populate('user', 'fullName email avatar')

    // For approved/rejected tabs, also include instructors from User model who don't have InstructorRequest records
    if (status === 'approved' || status === 'rejected') {
      const existingUserIds = requests.map(r => r.user?._id?.toString() || r.user?.toString()).filter(Boolean)
      const userFilter = status === 'approved'
        ? { role: 'instructor', isApprovedInstructor: true }
        : { instructorRequestStatus: 'rejected' }
      const extraUsers = await User.find(userFilter).select('fullName email avatar expertise bio phone createdAt')
      const extras = extraUsers
        .filter(u => !existingUserIds.includes(u._id.toString()))
        .map(u => ({
          _id: u._id,
          user: u,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || '',
          department: '',
          expertise: u.expertise || [],
          motivation: u.bio || '',
          status,
          createdAt: u.createdAt,
        }))
      requests.push(...extras)
    }

    res.json(new ApiResponse(200, requests))
  } catch (err) { next(err) }
}

export async function approveRequest(req, res, next) {
  try {
    const request = await InstructorRequest.findById(req.params.id).populate('user', 'fullName email avatar role')
    if (!request) throw new ApiError(404, 'Request not found')

    request.status     = 'approved'
    request.reviewedBy = req.user._id
    request.reviewedAt = new Date()
    await request.save()

    await User.findByIdAndUpdate(request.user._id, {
      role: 'instructor',
      isApprovedInstructor: true,
      instructorRequestStatus: 'approved',
      expertise: request.expertise,
      linkedin:  request.linkedin,
      portfolio: request.portfolio,
      phone:     request.phone,
      department:request.department,
    })

    try {
      const { subject, html } = approvalEmail(request.fullName)
      await sendEmail({ to: request.email, subject, html })
    } catch (_) {}

    res.json(new ApiResponse(200, null, 'Instructor approved'))
  } catch (err) { next(err) }
}

export async function rejectRequest(req, res, next) {
  try {
    const { reason } = req.body
    if (!reason) throw new ApiError(400, 'Rejection reason required')

    const request = await InstructorRequest.findById(req.params.id)
    if (!request) throw new ApiError(404, 'Request not found')

    request.status          = 'rejected'
    request.rejectionReason = reason
    request.reviewedBy      = req.user._id
    request.reviewedAt      = new Date()
    await request.save()

    const userId = request.user?._id || request.user
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        instructorRequestStatus:   'rejected',
        instructorRejectionReason: reason,
      })
    }

    // Send email notification non-blockingly to prevent connection timeouts
    try {
      const { subject, html } = rejectionEmail(request.fullName, reason)
      sendEmail({ to: request.email, subject, html }).catch(() => {})
    } catch (_) {}

    res.json(new ApiResponse(200, request, 'Application rejected'))
  } catch (err) { next(err) }
}

export async function getUsers(req, res, next) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    const filter = {}
    if (role)   filter.role = role
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [{ fullName: { $regex: escapedSearch, $options: 'i' } }, { email: { $regex: escapedSearch, $options: 'i' } }]
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).select('-password -refreshToken -resetPasswordToken')
    const total = await User.countDocuments(filter)
    res.json(new ApiResponse(200, users, 'Users fetched', { total }))
  } catch (err) { next(err) }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body
    const updateObj = { role }
    if (role === 'instructor') {
      updateObj.isApprovedInstructor = true
      updateObj.instructorRequestStatus = 'approved'
    } else {
      updateObj.isApprovedInstructor = false
      updateObj.instructorRequestStatus = 'none'
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateObj, { new: true }).select('-password')
    res.json(new ApiResponse(200, user, 'Role updated'))
  } catch (err) { next(err) }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { suspended } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { suspended }, { new: true }).select('-password')
    res.json(new ApiResponse(200, user))
  } catch (err) { next(err) }
}

export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user._id.toString()) {
      throw new ApiError(400, 'Admins cannot delete their own account')
    }
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) throw new ApiError(404, 'User not found')
    
    // Optional additional protection: Prevent deleting other admins
    if (targetUser.role === 'admin') {
      throw new ApiError(403, 'Admins cannot delete other administrators')
    }

    await targetUser.deleteOne()
    res.json(new ApiResponse(200, null, 'User deleted'))
  } catch (err) { next(err) }
}

export async function getAllCourses(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.status = status
    const courses = await Course.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('instructor', 'fullName')
    res.json(new ApiResponse(200, courses))
  } catch (err) { next(err) }
}

export async function updateCourseApproval(req, res, next) {
  try {
    const { status, isFree, price } = req.body
    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (isFree !== undefined) updateData.isFree = !!isFree
    if (price !== undefined) updateData.price = isFree ? 0 : (Number(price) || 0)

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    if (!course) throw new ApiError(404, 'Course not found')
    res.json(new ApiResponse(200, course, 'Course updated'))
  } catch (err) { next(err) }
}

export async function deleteCourse(req, res, next) {
  try {
    await Course.findByIdAndDelete(req.params.id)
    res.json(new ApiResponse(200, null, 'Course deleted'))
  } catch (err) { next(err) }
}

export async function getInstructors(req, res, next) {
  try {
    const instructors = await User.find({ role: 'instructor', isApprovedInstructor: true })
      .select('fullName email avatar expertise createdAt')
      .sort({ createdAt: -1 })
    const withCounts = await Promise.all(
      instructors.map(async (inst) => {
        const courseCount = await Course.countDocuments({ instructor: inst._id })
        const agg = await Course.aggregate([
          { $match: { instructor: inst._id } },
          { $project: { count: { $size: '$enrolledStudents' } } },
          { $group: { _id: null, total: { $sum: '$count' } } },
        ])
        return { ...inst.toObject(), courseCount, studentCount: agg[0]?.total || 0 }
      })
    )
    res.json(new ApiResponse(200, withCounts))
  } catch (err) { next(err) }
}

export async function getInstructor(req, res, next) {
  try {
    const instructor = await User.findById(req.params.id).select('fullName email avatar expertise bio createdAt role isApprovedInstructor')
    if (!instructor || instructor.role !== 'instructor') throw new ApiError(404, 'Instructor not found')
    res.json(new ApiResponse(200, instructor))
  } catch (err) { next(err) }
}

export async function getInstructorCourses(req, res, next) {
  try {
    const courses = await Course.find({ instructor: req.params.id }).sort({ createdAt: -1 })
    res.json(new ApiResponse(200, courses))
  } catch (err) { next(err) }
}

export async function adminCreateCourse(req, res, next) {
  try {
    const instructor = await User.findById(req.params.id)
    if (!instructor) throw new ApiError(404, 'Instructor not found')
    const { title, subtitle, description, category, language, status, level, price, isFree, tags, whatYouLearn, requirements, curriculum, thumbnail } = req.body
    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')
    const course = await Course.create({
      title, subtitle, description, category, language, status,
      instructor: req.params.id,
      thumbnail: uploadedThumbnail,
      level: level && ['Beginner', 'Intermediate', 'Advanced'].includes(level) ? level : undefined,
      price: isFree ? 0 : (Number(price) || 0),
      isFree: !!isFree,
      tags: Array.isArray(tags) ? tags : [],
      whatYouLearn: Array.isArray(whatYouLearn) ? whatYouLearn : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      curriculum: Array.isArray(curriculum) ? curriculum : [],
    })
    res.status(201).json(new ApiResponse(201, course, 'Course created'))
  } catch (err) { next(err) }
}

export async function adminUpdateCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) throw new ApiError(404, 'Course not found')
    const { title, subtitle, description, category, language, status, level, price, isFree, tags, whatYouLearn, requirements, curriculum, thumbnail } = req.body
    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')
    
    if (title !== undefined) course.title = title
    if (subtitle !== undefined) course.subtitle = subtitle
    if (description !== undefined) course.description = description
    if (category !== undefined) course.category = category
    if (language !== undefined) course.language = language
    if (status !== undefined) course.status = status
    if (uploadedThumbnail !== undefined) course.thumbnail = uploadedThumbnail
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) course.level = level
    if (price !== undefined) course.price = isFree ? 0 : (Number(price) || 0)
    if (isFree !== undefined) course.isFree = !!isFree
    if (Array.isArray(tags)) course.tags = tags
    if (Array.isArray(whatYouLearn)) course.whatYouLearn = whatYouLearn
    if (Array.isArray(requirements)) course.requirements = requirements
    if (Array.isArray(curriculum)) course.curriculum = curriculum
    await course.save()
    res.json(new ApiResponse(200, course, 'Course updated'))
  } catch (err) { next(err) }
}

export async function getSettings(req, res, next) {
  try {
    const settings = await Setting.find()
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})
    res.json(new ApiResponse(200, settingsMap))
  } catch (err) { next(err) }
}

export async function updateSetting(req, res, next) {
  try {
    const { key, value } = req.body
    if (!key) throw new ApiError(400, 'Key is required')
    
    await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    )
    res.json(new ApiResponse(200, { key, value }, 'Setting updated successfully'))
  } catch (err) { next(err) }
}
