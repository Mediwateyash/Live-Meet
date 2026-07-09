import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '', maxlength: 500 },

  isApprovedInstructor:      { type: Boolean, default: false },
  instructorRequestStatus:   { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  instructorRejectionReason: { type: String, default: '' },

  expertise:  [String],
  linkedin:   String,
  portfolio:  String,
  phone:      { type: String, select: false },
  department: String,

  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  wishlist:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  refreshToken:    { type: String, select: false },

  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  loginAttempts: { type: Number, default: 0 },
  lockUntil:     { type: Date },
  suspended:     { type: Boolean, default: false },
  tokenVersion:  { type: Number, default: 0 },
}, { timestamps: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('User', userSchema)
