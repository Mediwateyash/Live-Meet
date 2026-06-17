import mongoose from 'mongoose'

const liveLectureSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  duration:    { type: Number, default: 60 },

  // 'link' = external meeting URL | 'inapp' = built-in live room
  type:        { type: String, enum: ['link', 'inapp'], default: 'link' },
  meetingUrl:  { type: String, default: '', trim: true },

  status:      { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  startedAt:   { type: Date },
  endedAt:     { type: Date },

  attendance: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    sessions: [{
      joinedAt: { type: Date, default: Date.now },
      leftAt:   { type: Date }
    }]
  }],
}, { timestamps: true })

export default mongoose.model('LiveLecture', liveLectureSchema)
