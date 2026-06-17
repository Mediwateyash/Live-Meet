import Course     from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export async function getDashboard(req, res, next) {
  try {
    const courses   = await Course.find({ instructor: req.user._id })
    const courseIds = courses.map(c => c._id)

    // Accurate totals from Enrollment records
    const enrollments   = await Enrollment.find({ course: { $in: courseIds } })
    const totalStudents = enrollments.length
    const totalRevenue  = enrollments.reduce((sum, e) => sum + (e.price || 0), 0)

    // Weighted avg rating
    const ratings  = courses.filter(c => c.avgRating > 0)
    const avgRating = ratings.length
      ? ratings.reduce((sum, c) => sum + c.avgRating * (c.reviewCount || 1), 0)
        / ratings.reduce((sum, c) => sum + (c.reviewCount || 1), 0)
      : 0

    // 30-day revenue chart from Enrollment timestamps
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    const recentEnrollments = enrollments.filter(e => new Date(e.createdAt) >= thirtyDaysAgo)

    // Build a map of day -> revenue
    const dayMap = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      dayMap[key] = 0
    }
    for (const e of recentEnrollments) {
      const d   = new Date(e.createdAt)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      if (key in dayMap) dayMap[key] += e.price || 0
    }

    const revenueChart = Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue }))

    res.json(new ApiResponse(200, {
      totalCourses: courses.length,
      totalStudents,
      totalRevenue,
      avgRating:    Math.round(avgRating * 10) / 10,
      revenueChart,
    }))
  } catch (err) { next(err) }
}

export async function getMyCourses(req, res, next) {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 })
    res.json(new ApiResponse(200, courses))
  } catch (err) { next(err) }
}
