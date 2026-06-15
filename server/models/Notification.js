import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:       { type: String, enum: ['live_scheduled', 'live_started', 'live_updated', 'course_updated', 'general'], default: 'general' },
  title:      { type: String, required: true },
  message:    { type: String, default: '' },
  link:       { type: String, default: '' },
  read:       { type: Boolean, default: false },
  actorName:  { type: String, default: '' },
  actorAvatar:{ type: String, default: '' },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
