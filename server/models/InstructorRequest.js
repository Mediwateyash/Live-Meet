import mongoose from 'mongoose'

const instructorRequestSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:      String,
  email:         String,
  phone:         String,
  country:       { type: String, default: 'India' },
  department:    String,
  qualification: String,
  occupation:    String,
  organization:  String,
  experience:    String,
  expertise:     [String],
  teachingMode:  String,
  languages:     [String],
  bio:           String,
  motivation:    String,
  linkedin:      String,
  portfolio:     String,
  resume:        mongoose.Schema.Types.Mixed,
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:    Date,
}, { timestamps: true })

export default mongoose.model('InstructorRequest', instructorRequestSchema)
