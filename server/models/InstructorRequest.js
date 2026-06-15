import mongoose from 'mongoose'

const instructorRequestSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:   String,
  email:      String,
  phone:      String,
  department: String,
  expertise:  [String],
  motivation: String,
  linkedin:   String,
  portfolio:  String,
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true })

export default mongoose.model('InstructorRequest', instructorRequestSchema)
