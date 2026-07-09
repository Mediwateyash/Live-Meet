import Progress from '../models/Progress.js'
import Course   from '../models/Course.js'
import { ApiError }    from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function getProgress(req, res, next) {
  try {
    let progress = await Progress.findOne({ student: req.user._id, course: req.params.courseId })
    if (!progress) {
      // Return empty progress rather than 404 — avoids crashing CoursePlayer
      progress = { completedLessons: [], percentComplete: 0, lastWatchedPosition: 0 }
    } else {
      const course = await Course.findById(req.params.courseId)
      if (course) {
        let total = 0
        if (course.curriculum && course.curriculum.length > 0) {
          for (const section of course.curriculum) {
            total += section.lessons?.length || 0
          }
        }
        if (total === 0) total = course.totalLessons || 1
        
        const computedPercent = Math.min(100, Math.round((progress.completedLessons.length / total) * 100))
        if (progress.percentComplete !== computedPercent) {
          progress.percentComplete = computedPercent
          await progress.save().catch(() => {})
        }
      } else {
        if (progress.percentComplete > 100) {
          progress.percentComplete = 100
          await progress.save().catch(() => {})
        }
      }
    }
    res.json(new ApiResponse(200, progress))
  } catch (err) { next(err) }
}

export async function markLesson(req, res, next) {
  try {
    const { courseId, lessonId } = req.params
    const progress = await Progress.findOne({ student: req.user._id, course: courseId })
    if (!progress) throw new ApiError(404, 'Enroll in the course first')

    if (!progress.completedLessons.some(id => id.toString() === lessonId.toString())) {
      progress.completedLessons.push(lessonId)
    }
    progress.lastWatchedLesson = lessonId

    // Compute percent
    const course = await Course.findById(courseId)
    let total = 0
    if (course) {
      if (course.curriculum && course.curriculum.length > 0) {
        for (const section of course.curriculum) {
          total += section.lessons?.length || 0
        }
      }
      if (total === 0) total = course.totalLessons || 1
    } else {
      total = 1
    }
    
    progress.percentComplete = Math.min(100, Math.round((progress.completedLessons.length / total) * 100))

    if (progress.percentComplete >= 100) {
      progress.isCompleted = true
      progress.completedAt = new Date()
    }
    await progress.save()
    res.json(new ApiResponse(200, progress, 'Lesson marked complete'))
  } catch (err) { next(err) }
}

export async function savePosition(req, res, next) {
  try {
    const { courseId } = req.params
    const { position, lessonId } = req.body
    const progress = await Progress.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { lastWatchedPosition: position, lastWatchedLesson: lessonId },
      { new: true }
    )
    res.json(new ApiResponse(200, progress))
  } catch (err) { next(err) }
}

