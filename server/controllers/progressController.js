import Progress from '../models/Progress.js'
import Course   from '../models/Course.js'
import VideoEngagement from '../models/VideoEngagement.js'
import VideoSyncBatch from '../models/VideoSyncBatch.js'
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
export async function syncVideoProgress(req, res, next) {
  try {
    const { courseId, lessonId, videoDuration, lastPlaybackPosition, intervals, isNewSession, syncId } = req.body;
    const studentId = req.user._id;

    if (!courseId || !lessonId || !intervals || !Array.isArray(intervals) || !syncId) {
      throw new ApiError(400, "Missing required fields");
    }

    // 1. ATOMIC IDEMPOTENCY LOCK
    try {
      await VideoSyncBatch.create({ syncId });
    } catch (err) {
      // 11000 is Mongo Duplicate Key Error
      if (err.code === 11000) {
         const existing = await VideoEngagement.findOne({ studentId, courseId, lessonId });
         return res.json(new ApiResponse(200, {
           uniqueWatchedSeconds: existing?.uniqueWatchedSeconds || 0,
           completionPercentage: existing?.completionPercentage || 0,
           isCompleted: existing?.isCompleted || false
         }, 'Idempotent success: sync batch already processed'));
      }
      throw err;
    }

    // Filter valid intervals
    const validIntervals = intervals.filter(i => 
      typeof i.start === 'number' &&
      typeof i.end === 'number' &&
      i.start >= 0 && 
      i.end >= i.start && 
      (videoDuration ? i.end <= videoDuration + 2 : true)
    );

    const incrementalWatchedSeconds = validIntervals.reduce((total, i) => total + (i.end - i.start), 0);

    let engagement = await VideoEngagement.findOne({ studentId, courseId, lessonId });

    if (!engagement) {
      engagement = new VideoEngagement({
        studentId,
        courseId,
        lessonId,
        videoDuration,
        totalWatchedSeconds: 0,
        watchedIntervals: [],
        sessionCount: 0
      });
    }

    // Update basic stats
    if (videoDuration && engagement.videoDuration === 0) {
      engagement.videoDuration = videoDuration;
    }
    engagement.lastPlaybackPosition = lastPlaybackPosition;
    engagement.lastWatchedAt = new Date();
    
    if (isNewSession) {
      engagement.sessionCount += 1;
    }

    if (incrementalWatchedSeconds > 0) {
      engagement.totalWatchedSeconds += incrementalWatchedSeconds;
      
      const combinedIntervals = [...engagement.watchedIntervals, ...validIntervals];
      
      // Sort and merge overlapping intervals
      combinedIntervals.sort((a, b) => a.start - b.start);
      const merged = [combinedIntervals[0]];
      for (let i = 1; i < combinedIntervals.length; i++) {
        const current = combinedIntervals[i];
        const lastMerged = merged[merged.length - 1];
        
        if (current.start <= lastMerged.end + 0.1) {
          lastMerged.end = Math.max(lastMerged.end, current.end);
        } else {
          merged.push(current);
        }
      }
      
      engagement.watchedIntervals = merged;
      
      // Calculate unique watched seconds
      engagement.uniqueWatchedSeconds = merged.reduce((total, i) => total + (i.end - i.start), 0);
      
      if (engagement.videoDuration > 0) {
        engagement.completionPercentage = Math.min(100, (engagement.uniqueWatchedSeconds / engagement.videoDuration) * 100);
        
        if (engagement.completionPercentage >= 90) { 
          engagement.isCompleted = true;
          // Note: we do not silently modify the Progress document here to avoid breaking existing UI assumptions.
        }
      }
    }

    await engagement.save();

    res.json(new ApiResponse(200, {
      uniqueWatchedSeconds: engagement.uniqueWatchedSeconds,
      completionPercentage: engagement.completionPercentage,
      isCompleted: engagement.isCompleted
    }, 'Video engagement synced'));
    
  } catch (err) { next(err) }
}
