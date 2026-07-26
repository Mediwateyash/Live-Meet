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
}

export async function syncVideoProgress(req, res, next) {
  try {
    const { courseId, lessonId, videoDuration, lastPlaybackPosition, intervals, isNewSession, syncId } = req.body;
    const studentId = req.user._id;

    if (!courseId || !lessonId || !intervals || !Array.isArray(intervals) || !syncId) {
      throw new ApiError(400, "Missing required fields");
    }

    // 1. ATOMIC IDEMPOTENCY LOCK & LEASE
    const now = new Date();
    const staleTimeout = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes

    let batch = await VideoSyncBatch.findOne({ syncId });
    let isOurClaim = false;

    if (!batch) {
      try {
        batch = await VideoSyncBatch.create({ syncId, status: 'processing', processingStartedAt: now });
        isOurClaim = true;
      } catch (createErr) {
        if (createErr.code === 11000) {
          batch = await VideoSyncBatch.findOne({ syncId });
        } else {
          throw createErr;
        }
      }
    }

    if (batch && !isOurClaim) {
      if (batch.status === 'completed') {
         const existing = await VideoEngagement.findOne({ studentId, courseId, lessonId });
         return res.json(new ApiResponse(200, {
           uniqueWatchedSeconds: existing?.uniqueWatchedSeconds || 0,
           completionPercentage: existing?.completionPercentage || 0,
           isCompleted: existing?.isCompleted || false
         }, 'Idempotent success: sync batch already processed'));
      }

      if (batch.status === 'processing') {
         if (batch.processingStartedAt > staleTimeout) {
            return res.status(409).json({ message: 'Batch is currently processing' });
         }
         // Stale recovery (Atomic claim)
         const reclaimed = await VideoSyncBatch.findOneAndUpdate(
            { syncId, status: 'processing', processingStartedAt: batch.processingStartedAt },
            { $set: { processingStartedAt: now }, $inc: { attemptCount: 1 } },
            { new: true }
         );
         if (!reclaimed) return res.status(409).json({ message: 'Batch state changed during reclaim' });
      } else if (batch.status === 'failed') {
         // Failed recovery (Atomic claim)
         const reclaimed = await VideoSyncBatch.findOneAndUpdate(
            { syncId, status: 'failed' },
            { $set: { status: 'processing', processingStartedAt: now }, $inc: { attemptCount: 1 } },
            { new: true }
         );
         if (!reclaimed) return res.status(409).json({ message: 'Batch state changed during reclaim' });
      }
    }

    try {
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
          studentId, courseId, lessonId, videoDuration,
          totalWatchedSeconds: 0, watchedIntervals: [], sessionCount: 0
        });
      }

      if (videoDuration && engagement.videoDuration === 0) {
        engagement.videoDuration = videoDuration;
      }
      engagement.lastPlaybackPosition = lastPlaybackPosition;
      engagement.lastWatchedAt = new Date();
      
      if (isNewSession) engagement.sessionCount += 1;

      if (incrementalWatchedSeconds > 0) {
        engagement.totalWatchedSeconds += incrementalWatchedSeconds;
        
        const combinedIntervals = [
          ...(engagement.watchedIntervals || []).map(i => ({ start: Number(i.start), end: Number(i.end) })),
          ...validIntervals.map(i => ({ start: Number(i.start), end: Number(i.end) }))
        ];
        combinedIntervals.sort((a, b) => a.start - b.start);
        
        const merged = [{ start: combinedIntervals[0].start, end: combinedIntervals[0].end }];
        for (let i = 1; i < combinedIntervals.length; i++) {
          const current = combinedIntervals[i];
          const lastMerged = merged[merged.length - 1];
          if (current.start <= lastMerged.end + 0.1) {
            lastMerged.end = Math.max(lastMerged.end, current.end);
          } else {
            merged.push({ start: current.start, end: current.end });
          }
        }
        
        engagement.watchedIntervals = merged;
        engagement.uniqueWatchedSeconds = merged.reduce((total, i) => total + (i.end - i.start), 0);
        
        if (engagement.videoDuration > 0) {
          engagement.completionPercentage = Math.min(100, (engagement.uniqueWatchedSeconds / engagement.videoDuration) * 100);
          if (engagement.completionPercentage >= 90) { 
            engagement.isCompleted = true;
          }
        }
      }

      await engagement.save();

      // Automatically update/upsert student's Progress model for real-time progress & analytics tracking
      let studentProgress = await Progress.findOne({ student: studentId, course: courseId });
      if (!studentProgress) {
        studentProgress = new Progress({
          student: studentId,
          course: courseId,
          completedLessons: [],
          percentComplete: 0
        });
      }

      studentProgress.lastWatchedLesson = lessonId;
      if (typeof lastPlaybackPosition === 'number') {
        studentProgress.lastWatchedPosition = lastPlaybackPosition;
      }

      if (engagement.isCompleted) {
        const alreadyCompleted = studentProgress.completedLessons.some(id => String(id) === String(lessonId));
        if (!alreadyCompleted) {
          studentProgress.completedLessons.push(lessonId);
        }
      }

      // Compute total course lessons & updated percentComplete
      const courseDoc = await Course.findById(courseId).select('curriculum').lean();
      if (courseDoc && courseDoc.curriculum) {
        let totalLessonsCount = 0;
        for (const sec of courseDoc.curriculum) {
          totalLessonsCount += (sec.lessons?.length || 0);
        }
        if (totalLessonsCount > 0) {
          const completedCount = studentProgress.completedLessons.length;
          studentProgress.percentComplete = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));
          if (studentProgress.percentComplete >= 100 && !studentProgress.isCompleted) {
            studentProgress.isCompleted = true;
            studentProgress.completedAt = new Date();
          }
        }
      }

      await studentProgress.save();
      await VideoSyncBatch.findOneAndUpdate({ syncId }, { $set: { status: 'completed', completedAt: new Date() } });

      return res.json(new ApiResponse(200, {
        uniqueWatchedSeconds: engagement.uniqueWatchedSeconds,
        completionPercentage: engagement.completionPercentage,
        isCompleted: engagement.isCompleted
      }, 'Video engagement synced'));

    } catch (processErr) {
       await VideoSyncBatch.findOneAndUpdate({ syncId }, { $set: { status: 'failed', failedAt: new Date() } });
       throw processErr;
    }
    
  } catch (err) { next(err) }
}
