import mongoose from 'mongoose';

const intervalSchema = new mongoose.Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true }
}, { _id: false });

const videoEngagementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  videoDuration: {
    type: Number,
    default: 0
  },
  totalWatchedSeconds: {
    type: Number,
    default: 0
  },
  uniqueWatchedSeconds: {
    type: Number,
    default: 0
  },
  watchedIntervals: {
    type: [intervalSchema],
    default: []
  },
  lastPlaybackPosition: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  sessionCount: {
    type: Number,
    default: 1
  },
  firstWatchedAt: {
    type: Date,
    default: Date.now
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure one record per student-course-lesson
videoEngagementSchema.index({ studentId: 1, courseId: 1, lessonId: 1 }, { unique: true });

// Useful indexes for course analytics queries
videoEngagementSchema.index({ courseId: 1 });
videoEngagementSchema.index({ courseId: 1, studentId: 1 });
videoEngagementSchema.index({ courseId: 1, lessonId: 1 });

const VideoEngagement = mongoose.model('VideoEngagement', videoEngagementSchema);

export default VideoEngagement;
