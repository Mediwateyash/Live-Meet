/**
 * One-time script: create Enrollment records for all existing course enrollments.
 * Run once: node scripts/backfillEnrollments.js
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'

dotenv.config()

await mongoose.connect(process.env.MONGO_URI)
console.log('Connected to MongoDB')

const courses = await Course.find({})
let created = 0, skipped = 0

for (const course of courses) {
  for (const studentId of course.enrolledStudents) {
    try {
      await Enrollment.create({ student: studentId, course: course._id, price: course.price || 0 })
      created++
    } catch (err) {
      if (err.code === 11000) { skipped++ } // duplicate — already exists
      else console.error('Error:', err.message)
    }
  }
}

console.log(`Done. Created: ${created}, Skipped (duplicates): ${skipped}`)
await mongoose.disconnect()
