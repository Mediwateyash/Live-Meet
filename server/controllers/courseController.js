import Course     from '../models/Course.js'
import User       from '../models/User.js'
import Review     from '../models/Review.js'
import Progress   from '../models/Progress.js'
import Enrollment from '../models/Enrollment.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function browse(req, res, next) {
  try {
    const { q, category, level, price, sort = 'popular', page = 1, limit = 12 } = req.query

    const filter = { status: 'published' }
    if (q) {
      const matchingInstructors = await User.find(
        { fullName: { $regex: q, $options: 'i' } },
        '_id'
      )
      const instructorIds = matchingInstructors.map(u => u._id)
      filter.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        ...(instructorIds.length ? [{ instructor: { $in: instructorIds } }] : []),
      ]
    }
    if (category) filter.category = category
    if (level)    filter.level    = level
    if (price === 'free') filter.isFree = true
    if (price === 'paid') filter.isFree = false

    const sortMap = {
      popular:    { 'enrolledStudents': -1 },
      newest:     { createdAt: -1 },
      rating:     { avgRating: -1 },
      'price-asc': { price: 1 },
      'price-desc':{ price: -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [courses, total] = await Promise.all([
      Course.find(filter).sort(sortMap[sort] || sortMap.popular).skip(skip).limit(Number(limit)).populate('instructor', 'fullName avatar'),
      Course.countDocuments(filter),
    ])

    res.json(new ApiResponse(200, courses, 'Courses fetched', { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }))
  } catch (err) { next(err) }
}

export async function getFeatured(req, res, next) {
  try {
    const courses = await Course.find({ status: 'published' })
      .sort({ avgRating: -1, 'enrolledStudents': -1 })
      .limit(6)
      .populate('instructor', 'fullName avatar')
    res.json(new ApiResponse(200, courses))
  } catch (err) { next(err) }
}

export async function getBySlug(req, res, next) {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.slug)
    const query = isId ? { _id: req.params.slug } : { slug: req.params.slug }
    const course = await Course.findOne(query)
      .populate('instructor', 'fullName avatar bio')
    if (!course) throw new ApiError(404, 'Course not found')

    // Fetch reviews
    const reviews = await Review.find({ course: course._id })
      .populate('student', 'fullName avatar')
      .sort({ createdAt: -1 })

    const courseObj = course.toObject()
    courseObj.reviews = reviews

    res.json(new ApiResponse(200, courseObj))
  } catch (err) { next(err) }
}

export async function createCourse(req, res, next) {
  try {
    const { title, subtitle, description, category, level, language, tags, whatYouLearn, requirements, curriculum, thumbnail, price, isFree, status } = req.body
    if (!title || !category) throw new ApiError(400, 'Title and category required')

    const courseData = {
      title, subtitle, description, category, language,
      tags:         Array.isArray(tags)         ? tags         : [],
      whatYouLearn: Array.isArray(whatYouLearn) ? whatYouLearn : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      curriculum:   Array.isArray(curriculum)   ? curriculum   : [],
      thumbnail,
      price:        isFree ? 0 : (Number(price) || 0),
      isFree:       !!isFree,
      status:       status || 'draft',
      instructor:   req.user._id,
    }
    // Only set level if it's a valid enum value
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      courseData.level = level
    }

    const course = await Course.create(courseData)
    res.status(201).json(new ApiResponse(201, course, 'Course created'))
  } catch (err) { next(err) }
}

export async function updateCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) throw new ApiError(404, 'Course not found')
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    const { level, price, isFree, tags, whatYouLearn, requirements, curriculum, ...rest } = req.body
    const finalCurriculum = Array.isArray(curriculum) ? curriculum : course.curriculum

    // Recalculate totals (pre('save') doesn't run on findByIdAndUpdate)
    let totalDuration = 0, totalLessons = 0
    for (const section of finalCurriculum) {
      for (const lesson of section.lessons || []) {
        totalDuration += lesson.duration || 0
        totalLessons++
      }
    }

    const updateData = {
      ...rest,
      tags:         Array.isArray(tags)         ? tags         : course.tags,
      whatYouLearn: Array.isArray(whatYouLearn) ? whatYouLearn : course.whatYouLearn,
      requirements: Array.isArray(requirements) ? requirements : course.requirements,
      curriculum:   finalCurriculum,
      price:        isFree ? 0 : (Number(price) || course.price),
      isFree:       isFree !== undefined ? !!isFree : course.isFree,
      totalDuration,
      totalLessons,
    }
    // Regenerate slug if title changed
    if (rest.title && rest.title !== course.title) {
      updateData.slug = rest.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      updateData.level = level
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    res.json(new ApiResponse(200, updated, 'Course updated'))
  } catch (err) { next(err) }
}

export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) throw new ApiError(404, 'Course not found')
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized')
    }
    await course.deleteOne()
    res.json(new ApiResponse(200, null, 'Course deleted'))
  } catch (err) { next(err) }
}

const isEnrolledIn = (user, courseId) =>
  user.enrolledCourses.some(id => id.toString() === courseId.toString())

export async function enroll(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course || course.status !== 'published') throw new ApiError(404, 'Course not found or not published')

    const user = await User.findById(req.user._id)
    if (isEnrolledIn(user, course._id)) throw new ApiError(400, 'Already enrolled')

    user.enrolledCourses.push(course._id)
    await user.save({ validateBeforeSave: false })

    course.enrolledStudents.push(user._id)
    await course.save()

    await Progress.create({ student: user._id, course: course._id })

    // Record enrollment with price snapshot for revenue analytics
    await Enrollment.create({ student: user._id, course: course._id, price: course.price || 0 })

    res.json(new ApiResponse(200, null, 'Enrolled successfully'))
  } catch (err) { next(err) }
}

export async function getLearn(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'fullName avatar')
    if (!course) throw new ApiError(404, 'Course not found')

    const enrolled = isEnrolledIn(req.user, course._id)
    if (!enrolled && req.user.role !== 'admin') throw new ApiError(403, 'Not enrolled in this course')

    res.json(new ApiResponse(200, course))
  } catch (err) { next(err) }
}

export async function addReview(req, res, next) {
  try {
    const { rating, comment } = req.body
    const course = await Course.findById(req.params.id)
    if (!course) throw new ApiError(404, 'Course not found')

    const enrolled = isEnrolledIn(req.user, course._id)
    if (!enrolled) throw new ApiError(403, 'Must be enrolled to review')

    const existing = await Review.findOne({ course: course._id, student: req.user._id })
    if (existing) throw new ApiError(400, 'Already reviewed this course')

    const review = await Review.create({ course: course._id, student: req.user._id, rating, comment })

    // Update avg rating
    const reviews  = await Review.find({ course: course._id })
    const avg      = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    course.avgRating   = Math.round(avg * 10) / 10
    course.reviewCount = reviews.length
    await course.save()

    res.status(201).json(new ApiResponse(201, review, 'Review added'))
  } catch (err) { next(err) }
}
