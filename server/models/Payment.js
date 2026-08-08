import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'success', 'failed'], default: 'created' },
  verificationTimestamp: { type: Date }
}, { timestamps: true })

paymentSchema.index({ razorpay_order_id: 1 }, { unique: true })
paymentSchema.index({ user: 1, course: 1 })

export default mongoose.model('Payment', paymentSchema)
