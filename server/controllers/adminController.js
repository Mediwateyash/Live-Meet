import User               from '../models/User.js'
import Course             from '../models/Course.js'
import InstructorRequest  from '../models/InstructorRequest.js'
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

    await User.findByIdAndUpdate(request.user, {
      instructorRequestStatus:   'rejected',
      instructorRejectionReason: reason,
    })

    try {
      const { subject, html } = rejectionEmail(request.fullName, reason)
      await sendEmail({ to: request.email, subject, html })
    } catch (_) {}

    res.json(new ApiResponse(200, null, 'Application rejected'))
  } catch (err) { next(err) }
}

export async function getUsers(req, res, next) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    const filter = {}
    if (role)   filter.role = role
    if (search) filter.$or  = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).select('-password -refreshToken -resetPasswordToken')
    const total = await User.countDocuments(filter)
    res.json(new ApiResponse(200, users, 'Users fetched', { total }))
  } catch (err) { next(err) }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
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
    await User.findByIdAndDelete(req.params.id)
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
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
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
    const { level, price, isFree, tags, whatYouLearn, requirements, curriculum, thumbnail, ...rest } = req.body
    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')
    const course = await Course.create({
      ...rest,
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
    const { level, price, isFree, tags, whatYouLearn, requirements, curriculum, thumbnail, ...rest } = req.body
    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')
    Object.assign(course, rest)
    if (uploadedThumbnail !== undefined) course.thumbnail = uploadedThumbnail
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) course.level = level
    course.price = isFree ? 0 : (Number(price) || 0)
    course.isFree = !!isFree
    if (Array.isArray(tags)) course.tags = tags
    if (Array.isArray(whatYouLearn)) course.whatYouLearn = whatYouLearn
    if (Array.isArray(requirements)) course.requirements = requirements
    if (Array.isArray(curriculum)) course.curriculum = curriculum
    await course.save()
    res.json(new ApiResponse(200, course, 'Course updated'))
  } catch (err) { next(err) }
}
