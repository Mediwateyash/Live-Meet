import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author:  { type: String, required: true },
  role:    { type: String, required: true },
  avatar:  { type: String, default: '' },
  rating:  { type: Number, default: 5, min: 1, max: 5 },
  isActive:{ type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Testimonial', testimonialSchema)
