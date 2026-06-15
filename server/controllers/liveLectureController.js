import LiveLecture from '../models/LiveLecture.js'
import Course from '../models/Course.js'
import { ApiError } from '../utils/ApiError.js'
import { notifyEnrolledStudents } from '../utils/notify.js'

function fmt(dt) {
  return new Date(dt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Instructors: list their own lectures
export async function getMyLectures(req, res, next) {
  try {
    const filter = { instructor: req.user._id }
    if (req.query.courseId) filter.courseId = req.query.courseId
    const lectures = await LiveLecture.find(filter)
      .populate('courseId', 'title slug')
      .sort({ scheduledAt: -1 })
    res.json({ success: true, data: lectures })
  } catch (err) { next(err) }
}

// Students: lectures for an enrolled course
export async function getEnrolledLectures(req, res, next) {
  try {
    const courseId = req.query.courseId
    if (!courseId) return res.json({ success: true, data: [] })

    const course = await Course.findById(courseId)
    if (!course) throw new ApiError(404, 'Course not found')

    const isEnrolled = course.enrolledStudents.some(id => id.toString() === req.user._id.toString())
    if (!isEnrolled) throw new ApiError(403, 'Not enrolled in this course')

    const lectures = await LiveLecture.find({ courseId })
      .populate('instructor', 'fullName avatar')
      .sort({ scheduledAt: -1 })
    res.json({ success: true, data: lectures })
  } catch (err) { next(err) }
}

// Create a lecture
export async function createLecture(req, res, next) {
  try {
    const { title, description, courseId, scheduledAt, duration, meetingUrl, type } = req.body

    if (!title || !scheduledAt) throw new ApiError(400, 'title and scheduledAt are required')
    if (new Date(scheduledAt) <= new Date()) throw new ApiError(400, 'Scheduled date must be in the future')

    const lectureType = type === 'inapp' ? 'inapp' : 'link'
    if (lectureType === 'link' && !meetingUrl?.trim()) {
      throw new ApiError(400, 'meetingUrl is required for external-link lectures')
    }

    let instructorId = req.user._id
    if (req.user.role === 'admin' && req.body.instructor) instructorId = req.body.instructor

    if (courseId) {
      const course = await Course.findById(courseId)
      if (!course) throw new ApiError(404, 'Course not found')
      if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You can only schedule lectures for your own courses')
      }
    }

    const lecture = await LiveLecture.create({
      title: title.trim(),
      description: description?.trim() || '',
      courseId: courseId || null,
      instructor: instructorId,
      scheduledAt,
      duration: Number(duration) || 60,
      type: lectureType,
      meetingUrl: lectureType === 'link' ? meetingUrl.trim() : '',
    })

    const populated = await LiveLecture.findById(lecture._id)
      .populate('courseId', 'title slug')
      .populate('instructor', 'fullName avatar')

    // Notify enrolled students if linked to a course
    if (courseId) {
      const courseName = populated.courseId?.title || 'your course'
      await notifyEnrolledStudents({
        courseId,
        type:     'live_scheduled',
        title:    `New live lecture scheduled`,
        message:  `${req.user.fullName} scheduled "${title}" for ${courseName} on ${fmt(scheduledAt)}`,
        link:     `/course/${populated.courseId?.slug}/live`,
        actorName:   req.user.fullName,
        actorAvatar: req.user.avatar || '',
      })
    }

    res.status(201).json({ success: true, data: populated })
  } catch (err) { next(err) }
}

// Update a lecture
export async function updateLecture(req, res, next) {
  try {
    const lecture = await LiveLecture.findById(req.params.id)
    if (!lecture) throw new ApiError(404, 'Lecture not found')

    const isOwner = lecture.instructor.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not authorized')
    if (lecture.status === 'ended') throw new ApiError(400, 'Cannot edit an ended lecture')

    const { title, description, scheduledAt, duration, meetingUrl, status } = req.body
    let wentLive = false

    if (title) lecture.title = title.trim()
    if (description !== undefined) lecture.description = description.trim()
    if (scheduledAt) {
      if (new Date(scheduledAt) <= new Date()) throw new ApiError(400, 'Scheduled date must be in the future')
      lecture.scheduledAt = scheduledAt
    }
    if (duration) lecture.duration = Number(duration)
    if (meetingUrl !== undefined) lecture.meetingUrl = meetingUrl.trim()
    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      if (status === 'live' && lecture.status !== 'live') { lecture.startedAt = new Date(); wentLive = true }
      if (status === 'ended' && lecture.status !== 'ended') lecture.endedAt = new Date()
      lecture.status = status
    }

    await lecture.save()

    const populated = await LiveLecture.findById(lecture._id)
      .populate('courseId', 'title slug')
      .populate('instructor', 'fullName avatar')

    // Notify when a lecture goes live
    if (wentLive && lecture.courseId) {
      await notifyEnrolledStudents({
        courseId: lecture.courseId,
        type:     'live_started',
        title:    `Live lecture is starting now! 🔴`,
        message:  `"${lecture.title}" is now live. Join now!`,
        link:     lecture.type === 'inapp'
                    ? `/live/${lecture._id}`
                    : populated.courseId?.slug ? `/course/${populated.courseId.slug}/live` : '',
        actorName:   req.user.fullName,
        actorAvatar: req.user.avatar || '',
      })
    }

    res.json({ success: true, data: populated })
  } catch (err) { next(err) }
}

// Delete a lecture
export async function deleteLecture(req, res, next) {
  try {
    const lecture = await LiveLecture.findById(req.params.id)
    if (!lecture) throw new ApiError(404, 'Lecture not found')

    const isOwner = lecture.instructor.toString() === req.user._id.toString()
    if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not authorized')

    await LiveLecture.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Lecture deleted' })
  } catch (err) { next(err) }
}

// Get a single lecture by ID (any authenticated user — access checked on socket join)
export async function getLectureById(req, res, next) {
  try {
    const lecture = await LiveLecture.findById(req.params.id)
      .populate('courseId',   'title slug enrolledStudents')
      .populate('instructor', 'fullName avatar')
    if (!lecture) throw new ApiError(404, 'Lecture not found')

    // Students must be enrolled in the linked course
    if (req.user.role === 'student' && lecture.courseId) {
      const enrolled = lecture.courseId.enrolledStudents?.some(
        id => id.toString() === req.user._id.toString()
      )
      if (!enrolled) throw new ApiError(403, 'You are not enrolled in this course')
    }

    res.json({ success: true, data: lecture })
  } catch (err) { next(err) }
}

// Admin: all lectures
export async function adminGetAllLectures(req, res, next) {
  try {
    const filter = {}
    if (req.query.courseId)   filter.courseId  = req.query.courseId
    if (req.query.instructor) filter.instructor = req.query.instructor
    const lectures = await LiveLecture.find(filter)
      .populate('courseId',  'title slug')
      .populate('instructor', 'fullName email avatar')
      .sort({ scheduledAt: -1 })
    res.json({ success: true, data: lectures })
  } catch (err) { next(err) }
}
