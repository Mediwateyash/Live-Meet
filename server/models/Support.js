import mongoose from 'mongoose'

const supportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Bug Report', 'General Feedback', 'Course Question', 'Feature Request', 'Other'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'replied'],
    default: 'pending'
  },
  reply: {
    type: String,
    default: ''
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  repliedAt: {
    type: Date
  }
}, { timestamps: true })

supportSchema.index({ student: 1, createdAt: -1 })
supportSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Support', supportSchema)
