import Course     from '../models/Course.js'
import User       from '../models/User.js'
import Review     from '../models/Review.js'
import Progress   from '../models/Progress.js'
import Enrollment from '../models/Enrollment.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadBase64Image } from '../utils/cloudinaryUpload.js'
import jwt from 'jsonwebtoken'
import { validateUrlForSsrf } from '../utils/ssrfFilter.js'
import { generateWHQuestions } from '../services/aiService.js'
import { fetchYoutubeMetadata } from '../services/youtubeService.js'

export async function browse(req, res, next) {
  try {
    const { q, category, level, price, sort = 'popular', page = 1, limit = 12 } = req.query

    const filter = { status: 'published' }
    if (q) {
      // Prevent NoSQL injection: ?q[$gt]='' gets parsed by Express as {q:{$gt:''}}
      // A non-string q means a MongoDB operator was injected — reject it immediately
      if (typeof q !== 'string') {
        throw new ApiError(400, 'Invalid search query format')
      }
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
      .limit(8)
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
                       (course.instructor?._id || course.instructor).toString() === user._id.toString()
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

    // ── Atomic enroll: one round-trip, no race condition ─────────────────────
    // Condition: enrolledCourses array has < 50 items AND course not already in it
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        enrolledCourses: { $ne: course._id },        // not already enrolled
        'enrolledCourses.49': { $exists: false },     // array length < 50 (0-indexed 49th slot must not exist)
      },
      { $addToSet: { enrolledCourses: course._id } },
      { new: true }
    )

    if (!updatedUser) {
      // Either already enrolled or enrollment cap reached — distinguish with a secondary check
      const user = await User.findById(req.user._id).select('enrolledCourses')
      if (user.enrolledCourses.some(id => id.toString() === course._id.toString())) {
        throw new ApiError(400, 'Already enrolled')
      }
      throw new ApiError(400, 'Enrollment limit reached (maximum 50 courses per student)')
    }

    // Update course's enrolled students list
    await Course.findByIdAndUpdate(course._id, { $addToSet: { enrolledStudents: req.user._id } })

    await Progress.create({ student: req.user._id, course: course._id })

    // Record enrollment with price snapshot for revenue analytics
    await Enrollment.create({ student: req.user._id, course: course._id, price: course.price || 0 })

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

    // Block URLs that embed credentials — these are a primary SSRF bypass vector
    if (parsedUrl.username || parsedUrl.password) {
      throw new ApiError(400, 'Credentials in URL are not allowed');
    }

    // Only accept exact-match YouTube hostnames
    const allowedHostnames = new Set(['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']);
    if (!allowedHostnames.has(parsedUrl.hostname)) {
      throw new ApiError(400, 'Only YouTube URLs are allowed');
    }

    try {
      await validateUrlForSsrf(url);
    } catch (ssrfErr) {
      throw new ApiError(400, ssrfErr.message);
    }

    let meta;
    try {
      meta = await fetchYoutubeMetadata(url);
    } catch (ytErr) {
      throw new ApiError(400, ytErr.message || 'Could not fetch YouTube video metadata.');
    }

    res.json(new ApiResponse(200, meta, 'YouTube metadata retrieved successfully'));
  } catch (err) { next(err) }
}

export async function generateLessonWH(req, res, next) {
  try {
    const { id, sectionIndex, lessonIndex } = req.params;
    const { pdfUrl, numQuestions = 5 } = req.body;
    
    if (!pdfUrl) throw new ApiError(400, 'PDF URL is required');

    const course = await Course.findById(id);
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized');
    }

    const lesson = course.curriculum[sectionIndex]?.lessons[lessonIndex];
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    // Fetch the PDF file securely
    let parsedUrl;
    try {
      parsedUrl = new URL(pdfUrl);
    } catch (e) {
      throw new ApiError(400, 'Invalid PDF URL format');
    }
    
    const response = await fetch(parsedUrl.href);
    if (!response.ok) throw new ApiError(400, 'Failed to fetch PDF file');
    
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Call AI Service
    const whQuestions = await generateWHQuestions({
      fileBuffer,
      mimeType: 'application/pdf',
      numQuestions: Math.min(Math.max(parseInt(numQuestions), 2), 20),
      chapterName: lesson.title
    });

    res.json(new ApiResponse(200, whQuestions, 'WH Questions generated'));
  } catch (err) { next(err); }
}

export async function saveLessonWH(req, res, next) {
  try {
    const { id, sectionIndex, lessonIndex } = req.params;
    const { whQuestions } = req.body;

    if (!Array.isArray(whQuestions)) throw new ApiError(400, 'whQuestions must be an array');

    const course = await Course.findById(id);
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized');
    }

    if (!course.curriculum[sectionIndex] || !course.curriculum[sectionIndex].lessons[lessonIndex]) {
      throw new ApiError(404, 'Lesson not found');
    }

    course.curriculum[sectionIndex].lessons[lessonIndex].whQuestions = whQuestions;
    
    // Mark modified so mongoose saves the mixed subdocument properly
    course.markModified('curriculum');
    await course.save();

    res.json(new ApiResponse(200, course, 'WH Questions saved successfully'));
  } catch (err) { next(err); }
}
