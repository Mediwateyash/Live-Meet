import Course  from '../models/Course.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function getDashboard(req, res, next) {
  try {
    const courses = await Course.find({ instructor: req.user._id })
    const totalStudents = courses.reduce((a, c) => a + c.enrolledStudents.length, 0)
    const totalRevenue  = courses.reduce((a, c) => a + c.enrolledStudents.length * c.price, 0)
    const ratings       = courses.filter(c => c.avgRating > 0).map(c => c.avgRating)
    const avgRating     = ratings.length ? ratings.reduce((a, r) => a + r, 0) / ratings.length : 0

    res.json(new ApiResponse(200, {
      totalCourses:  courses.length,
      totalStudents,
      totalRevenue,
      avgRating:     Math.round(avgRating * 10) / 10,
      revenueChart:  [],
    }))
  } catch (err) { next(err) }
}

export async function getMyCourses(req, res, next) {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 })
    res.json(new ApiResponse(200, courses))
  } catch (err) { next(err) }
}

