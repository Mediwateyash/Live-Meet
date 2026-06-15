import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import 'dotenv/config'
import User from '../models/User.js'
import Course from '../models/Course.js'
import InstructorRequest from '../models/InstructorRequest.js'
import Progress from '../models/Progress.js'
import Review from '../models/Review.js'

const CATEGORIES = ['Web Development', 'Data Science', 'AI / ML', 'Design']

const COURSES_DATA = [
  { title: 'Complete React Developer Bootcamp', category: 'Web Development', level: 'Beginner', price: 499, description: 'Master React 18 from scratch.', whatYouLearn: ['React Hooks', 'Context API', 'Redux', 'React Router'], requirements: ['Basic JavaScript knowledge'], curriculum: [{ title: 'Introduction', lessons: [{ title: 'Welcome', duration: 300, isFree: true }, { title: 'Setup', duration: 600 }] }] },
  { title: 'Python for Data Science', category: 'Data Science', level: 'Intermediate', price: 599, description: 'Master Python for data analysis.', whatYouLearn: ['Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn'], requirements: ['Basic Python'], curriculum: [{ title: 'Python Basics Review', lessons: [{ title: 'Variables', duration: 400, isFree: true }] }] },
  { title: 'Machine Learning A-Z', category: 'AI / ML', level: 'Advanced', price: 799, description: 'End-to-end ML pipeline.', whatYouLearn: ['Supervised Learning', 'Neural Networks', 'Model Deployment'], requirements: ['Python basics', 'Linear algebra'], curriculum: [{ title: 'Getting Started', lessons: [{ title: 'What is ML?', duration: 600, isFree: true }] }] },
  { title: 'UI/UX Design Fundamentals', category: 'Design', level: 'Beginner', price: 399, description: 'Learn design thinking and Figma.', whatYouLearn: ['Design principles', 'Figma', 'Prototyping', 'User research'], requirements: ['No prior experience needed'], curriculum: [{ title: 'Design Thinking', lessons: [{ title: 'Introduction to UX', duration: 500, isFree: true }] }] },
  { title: 'Node.js + Express Backend', category: 'Web Development', level: 'Intermediate', price: 549, description: 'Build REST APIs with Node.js.', whatYouLearn: ['Express', 'MongoDB', 'JWT Auth', 'REST APIs'], requirements: ['JavaScript basics'], curriculum: [{ title: 'Node.js Fundamentals', lessons: [{ title: 'What is Node?', duration: 480, isFree: true }] }] },
  { title: 'Deep Learning with TensorFlow', category: 'AI / ML', level: 'Advanced', price: 899, description: 'Deep neural networks from scratch.', whatYouLearn: ['CNNs', 'RNNs', 'Transfer Learning', 'Computer Vision'], requirements: ['Python', 'ML basics'], curriculum: [{ title: 'Neural Networks', lessons: [{ title: 'Perceptron', duration: 720, isFree: true }] }] },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      InstructorRequest.deleteMany({}),
      Progress.deleteMany({}),
      Review.deleteMany({}),
    ])
    console.log('Cleared existing data')

    // Create admin
    const admin = await User.create({
      fullName: 'Zenius Admin',
      email:    'admin@zenius.ai',
      password: 'Admin@2026',
      role:     'admin',
    })
    console.log('✅ Admin created:', admin.email)

    // Create 2 instructors
    const [inst1, inst2] = await Promise.all([
      User.create({ fullName: 'Priya Sharma', email: 'priya@zenius.ai', password: 'Instructor@2026', role: 'instructor', isApprovedInstructor: true, instructorRequestStatus: 'approved', bio: 'Senior React developer with 8 years experience.', expertise: ['React', 'JavaScript', 'Node.js'] }),
      User.create({ fullName: 'Rahul Mehta', email: 'rahul@zenius.ai', password: 'Instructor@2026', role: 'instructor', isApprovedInstructor: true, instructorRequestStatus: 'approved', bio: 'Data scientist and ML engineer.', expertise: ['Python', 'ML', 'Deep Learning'] }),
    ])
    console.log('✅ Instructors created')

    // Create 5 students
    const students = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        User.create({ fullName: `Student ${i + 1}`, email: `student${i + 1}@zenius.ai`, password: 'Student@2026', role: 'student' })
      )
    )
    console.log('✅ Students created')

    // Create courses
    const instructors = [inst1, inst2, inst1, inst2, inst1, inst2]
    const courses = await Promise.all(
      COURSES_DATA.map((data, i) =>
        Course.create({ ...data, instructor: instructors[i]._id, status: 'published', thumbnail: `https://placehold.co/400x225/EDE9FE/7C3AED?text=${encodeURIComponent(data.category)}` })
      )
    )
    console.log('✅ Courses created')

    // Enroll some students
    for (let i = 0; i < students.length; i++) {
      const student  = students[i]
      const enrolled = courses.slice(0, 3)
      student.enrolledCourses = enrolled.map(c => c._id)
      await student.save({ validateBeforeSave: false })
      for (const course of enrolled) {
        course.enrolledStudents.push(student._id)
        await course.save()
        await Progress.create({ student: student._id, course: course._id, completedLessons: [], percentComplete: Math.floor(Math.random() * 80) })
      }
    }
    console.log('✅ Enrollments and progress created')

    // Add reviews
    for (const course of courses.slice(0, 4)) {
      const review = await Review.create({ course: course._id, student: students[0]._id, rating: 4 + Math.round(Math.random()), comment: 'Excellent course! Highly recommended.' })
      course.avgRating   = 4.7
      course.reviewCount = 1
      await course.save()
    }
    console.log('✅ Reviews created')

    // One pending instructor request
    const pendingUser = await User.create({ fullName: 'Yash Diwate', email: 'yash@zenius.ai', password: 'Student@2026', role: 'student', instructorRequestStatus: 'pending' })
    await InstructorRequest.create({ user: pendingUser._id, fullName: 'Yash Diwate', email: 'yash@zenius.ai', phone: '9876543210', department: 'Computer Science', expertise: ['Python', 'AI'], motivation: 'I have 5 years of industry experience and want to share my knowledge with students who want to break into AI.' })

    console.log('\n🎉 Seed complete!')
    console.log('Admin:      admin@zenius.ai / Admin@2026')
    console.log('Instructor: priya@zenius.ai / Instructor@2026')
    console.log('Student:    student1@zenius.ai / Student@2026')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()
