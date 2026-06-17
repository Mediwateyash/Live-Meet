import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  price:    { type: Number, default: 0 },
}, { timestamps: true })

enrollmentSchema.index({ course: 1 })
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })

export default mongoose.model('Enrollment', enrollmentSchema)
