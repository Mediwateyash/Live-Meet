import Course     from '../models/Course.js'
import User       from '../models/User.js'
import Review     from '../models/Review.js'
import Progress   from '../models/Progress.js'
import Enrollment from '../models/Enrollment.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadBase64Image } from '../utils/cloudinaryUpload.js'
import jwt from 'jsonwebtoken'

export async function browse(req, res, next) {
  try {
    const { q, category, level, price, sort = 'popular', page = 1, limit = 12 } = req.query

    const filter = { status: 'published' }
    if (q) {
      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const matchingInstructors = await User.find(
        { fullName: { $regex: escapedQ, $options: 'i' } },
        '_id'
      )
      const instructorIds = matchingInstructors.map(u => u._id)
      filter.$or = [
        { title:       { $regex: escapedQ, $options: 'i' } },
        { description: { $regex: escapedQ, $options: 'i' } },
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

    // Only select public catalog fields — never expose curriculum/video URLs
    const publicFields = 'title slug subtitle thumbnail category level price isFree avgRating reviewCount totalDuration totalLessons enrolledStudents tags language createdAt'

    const skip = (Number(page) - 1) * Number(limit)
    const [courses, total] = await Promise.all([
      Course.find(filter).select(publicFields).sort(sortMap[sort] || sortMap.popular).skip(skip).limit(Number(limit)).populate('instructor', 'fullName avatar'),
      Course.countDocuments(filter),
    ])

    const coursesJSON = courses.map(c => {
      const obj = c.toObject()
      if (obj.enrolledStudents) {
        obj.enrolledStudents = Array(obj.enrolledStudents.length).fill(null)
      }
      return obj
    })

    res.json(new ApiResponse(200, coursesJSON, 'Courses fetched', { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }))
  } catch (err) { next(err) }
}

export async function getFeatured(req, res, next) {
  try {
    const publicFields = 'title slug subtitle thumbnail category level price isFree avgRating reviewCount totalDuration totalLessons enrolledStudents tags language createdAt'

    const courses = await Course.find({ status: 'published' })
      .select(publicFields)
      .sort({ avgRating: -1, 'enrolledStudents': -1 })
      .limit(6)
      .populate('instructor', 'fullName avatar')
      
    const coursesJSON = courses.map(c => {
      const obj = c.toObject()
      if (obj.enrolledStudents) {
        obj.enrolledStudents = Array(obj.enrolledStudents.length).fill(null)
      }
      return obj
    })

    res.json(new ApiResponse(200, coursesJSON))
  } catch (err) { next(err) }
}

export async function getBySlug(req, res, next) {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(req.params.slug)
    const query = isId ? { _id: req.params.slug } : { slug: req.params.slug }
    const course = await Course.findOne(query)
      .populate('instructor', 'fullName avatar bio')
      .populate('finalExam')
    if (!course) throw new ApiError(404, 'Course not found')

    // Fetch reviews
    const reviews = await Review.find({ course: course._id })
      .populate('student', 'fullName avatar')
      .sort({ createdAt: -1 })

    // Check if the user is logged in and authorized (enrolled, instructor, or admin)
    let isEnrolled = false
    const token = req.cookies?.accessToken
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        const user = await User.findById(decoded.userId)
        if (user) {
          isEnrolled = user.enrolledCourses.some(id => id.toString() === course._id.toString()) ||
                       user.role === 'admin' ||
                       course.instructor.toString() === user._id.toString()
        }
      } catch (err) {
        // invalid token, treat as visitor
      }
    }

    const courseObj = course.toObject()
    courseObj.reviews = reviews
    if (courseObj.enrolledStudents) {
      courseObj.enrolledStudents = Array(courseObj.enrolledStudents.length).fill(null)
    }

    // Strip video URLs and resources from public course detail for non-enrolled users
    if (!isEnrolled) {
      if (courseObj.curriculum) {
        courseObj.curriculum = courseObj.curriculum.map(section => ({
          ...section,
          lessons: (section.lessons || []).map(lesson => {
            if (lesson.isFree) {
              return {
                _id: lesson._id,
                title: lesson.title,
                duration: lesson.duration,
                isFree: true,
                videoUrl: lesson.videoUrl, // Keep for preview
              }
            } else {
              return {
                _id: lesson._id,
                title: lesson.title,
                duration: lesson.duration,
                isFree: false,
              }
            }
          })
        }))
      }
    }

    res.json(new ApiResponse(200, courseObj))
  } catch (err) { next(err) }
}

export async function createCourse(req, res, next) {
  try {
    const { title, subtitle, description, category, level, language, tags, whatYouLearn, requirements, curriculum, thumbnail, price, isFree, status } = req.body
    if (!title || !category) throw new ApiError(400, 'Title and category required')

    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')

    const courseData = {
      title, subtitle, description, category, language,
      tags:         Array.isArray(tags)         ? tags         : [],
      whatYouLearn: Array.isArray(whatYouLearn) ? whatYouLearn : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      curriculum:   Array.isArray(curriculum)   ? curriculum   : [],
      thumbnail:    uploadedThumbnail,
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
    const { level, price, isFree, tags, whatYouLearn, requirements, curriculum, finalExam, thumbnail, ...rest } = req.body
    const finalCurriculum = Array.isArray(curriculum) ? curriculum : course.curriculum

    const uploadedThumbnail = await uploadBase64Image(thumbnail, 'zenius/thumbnails')

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
      isFree:       isFree || price === 0,
      totalDuration,
      totalLessons,
    }
    if (uploadedThumbnail !== undefined) {
      updateData.thumbnail = uploadedThumbnail
    }
    if (finalExam !== undefined) {
      updateData.finalExam = finalExam || null
    }
    // Regenerate slug if title changed
    if (rest.title && rest.title !== course.title) {
      updateData.slug = rest.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      updateData.level = level
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('instructor', 'fullName avatar bio')
      .populate('finalExam')
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
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'fullName avatar')
      .populate('finalExam')
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

function parseISO8601Duration(durationString) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const matches = durationString.match(regex)
  if (!matches) return 0
  const hours = parseInt(matches[1] || 0)
  const minutes = parseInt(matches[2] || 0)
  const seconds = parseInt(matches[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}
export async function getYoutubeMeta(req, res, next) {
  try {
    const { url } = req.query
    if (!url) throw new ApiError(400, 'YouTube URL required')

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      throw new ApiError(400, 'Invalid URL format');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new ApiError(400, 'Invalid protocol');
    }

    const allowedHostnames = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
    const isAllowedHost = allowedHostnames.includes(parsedUrl.hostname) || parsedUrl.hostname.endsWith('.youtube.com');
    if (!isAllowedHost) {
      throw new ApiError(400, 'Only YouTube URLs are allowed');
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      })
    } catch (fetchErr) {
      clearTimeout(timeout)
      throw new ApiError(400, 'Failed to connect to YouTube or request timed out')
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) throw new ApiError(400, 'Failed to fetch YouTube page')
    
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      throw new ApiError(400, 'YouTube response content too large')
    }

    const html = await response.text()

    // Title
    const titleMatch = html.match(/itemprop="name"\s+content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/)
    let title = titleMatch ? titleMatch[1] : 'YouTube Video'
    title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

    // Duration
    const durationMatch = html.match(/itemprop="duration"\s+content="([^"]+)"/) || html.match(/meta\s+itemprop="duration"\s+content="([^"]+)"/)
    const durationISO = durationMatch ? durationMatch[1] : null
    let durationSeconds = 0
    if (durationISO) {
      durationSeconds = parseISO8601Duration(durationISO)
    }

    // Thumbnail
    const thumbMatch = html.match(/link\s+itemprop="thumbnailUrl"\s+href="([^"]+)"/) || html.match(/property="og:image"\s+content="([^"]+)"/)
    const thumbnail = thumbMatch ? thumbMatch[1] : null

    res.json(new ApiResponse(200, { title, duration: durationSeconds, thumbnail }))
  } catch (err) { next(err) }
}

