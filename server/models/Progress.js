import mongoose from 'mongoose'

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons:    [{ type: mongoose.Schema.Types.ObjectId }],
  lastWatchedLesson:   { type: mongoose.Schema.Types.ObjectId },
  lastWatchedPosition: { type: Number, default: 0 },
  percentComplete:     { type: Number, default: 0 },
  isCompleted:         { type: Boolean, default: false },
  hasPassedFinalExam:  { type: Boolean, default: false },
  hasGivenFeedback:    { type: Boolean, default: false },
  certificateIssuedAt: Date,
  completedAt:         Date,
}, { timestamps: true })

progressSchema.index({ student: 1, course: 1 }, { unique: true })

export default mongoose.model('Progress', progressSchema)
