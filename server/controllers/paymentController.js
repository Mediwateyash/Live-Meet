import Razorpay from 'razorpay'
import crypto from 'crypto'
import Course from '../models/Course.js'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import Enrollment from '../models/Enrollment.js'
import Progress from '../models/Progress.js'
import Setting from '../models/Setting.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function createOrder(req, res, next) {
  try {
    const { courseId } = req.body
    
    // Validate course
    const course = await Course.findById(courseId)
    if (!course || course.status !== 'published') {
      throw new ApiError(404, 'Course not found or not published')
    }

    if (course.isFree || course.price === 0) {
      throw new ApiError(400, 'Course is free, please use standard enrollment')
    }

    // Check payment gateway setting
    const paymentEnabledSetting = await Setting.findOne({ key: 'paymentGatewayEnabled' })
    const isPaymentEnabled = paymentEnabledSetting ? paymentEnabledSetting.value : true

    if (!isPaymentEnabled) {
      return res.json(new ApiResponse(200, { bypassPayment: true }, 'Payment gateway is currently disabled'))
    }

    // Check if user is already enrolled
    const user = await User.findById(req.user._id).select('enrolledCourses')
    if (user.enrolledCourses.some(id => id.toString() === course._id.toString())) {
      throw new ApiError(400, 'Already enrolled in this course')
    }

    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(500, 'Payment gateway is not configured')
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount: Math.round(course.price * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    }

    const order = await razorpay.orders.create(options)

    if (!order) {
      throw new ApiError(500, 'Could not create Razorpay order')
    }

    // Create payment tracking record
    await Payment.create({
      user: req.user._id,
      course: course._id,
      razorpay_order_id: order.id,
      amount: course.price,
      currency: 'INR',
      status: 'created'
    })

    res.json(new ApiResponse(200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    }, 'Order created successfully'))
  } catch (error) {
    next(error)
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const payment = await Payment.findOne({ razorpay_order_id }).populate('course')
    if (!payment) {
      throw new ApiError(404, 'Payment record not found')
    }

    if (payment.status === 'success') {
      throw new ApiError(400, 'Payment already verified')
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      payment.status = 'failed'
      payment.verificationTimestamp = new Date()
      await payment.save()
      throw new ApiError(400, 'Payment signature verification failed')
    }

    // Payment is authentic, proceed with enrollment
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = 'success'
    payment.verificationTimestamp = new Date()
    await payment.save()

    const course = payment.course

    // ── Atomic enroll: one round-trip, no race condition ─────────────────────
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: payment.user,
        enrolledCourses: { $ne: course._id },        // not already enrolled
        'enrolledCourses.49': { $exists: false },     // array length < 50
      },
      { $addToSet: { enrolledCourses: course._id } },
      { new: true }
    )

    if (!updatedUser) {
      // Check if they were already enrolled (maybe parallel request)
      const user = await User.findById(payment.user).select('enrolledCourses')
      if (user.enrolledCourses.some(id => id.toString() === course._id.toString())) {
        return res.json(new ApiResponse(200, null, 'Payment successful. Already enrolled.'))
      }
      throw new ApiError(400, 'Enrollment limit reached (maximum 50 courses per student)')
    }

    // Update course's enrolled students list
    await Course.findByIdAndUpdate(course._id, { $addToSet: { enrolledStudents: payment.user } })

    // Create progress tracking
    await Progress.create({ student: payment.user, course: course._id })

    // Record enrollment for analytics and instructor revenue tracking
    await Enrollment.create({ student: payment.user, course: course._id, price: payment.amount })

    res.json(new ApiResponse(200, null, 'Payment verified and enrolled successfully'))
  } catch (error) {
    next(error)
  }
}
