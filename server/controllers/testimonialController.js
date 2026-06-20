import Testimonial from '../models/Testimonial.js'
import Progress from '../models/Progress.js'

export const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 })
    res.json({ success: true, data: testimonials })
  } catch (error) {
    next(error)
  }
}

export const getAllTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 })
    res.json({ success: true, data: testimonials })
  } catch (error) {
    next(error)
  }
}

export const createTestimonial = async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (req.user) {
      data.userId = req.user._id
      data.author = req.user.fullName
      data.avatar = req.user.avatar || ''
    }

    const testimonial = await Testimonial.create(data)

    // If this is feedback for a course, update progress to unlock certificate
    if (data.courseId && req.user) {
      await Progress.findOneAndUpdate(
        { student: req.user._id, course: data.courseId, hasPassedFinalExam: true },
        { hasGivenFeedback: true, certificateIssuedAt: new Date() }
      )
    }

    res.status(201).json({ success: true, data: testimonial })
  } catch (error) {
    next(error)
  }
}

export const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' })
    res.json({ success: true, data: testimonial })
  } catch (error) {
    next(error)
  }
}

export const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id)
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' })
    res.json({ success: true, data: {} })
  } catch (error) {
    next(error)
  }
}
