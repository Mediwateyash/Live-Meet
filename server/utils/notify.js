import Notification from '../models/Notification.js'
import Course from '../models/Course.js'

// Create notifications for all students enrolled in a course
export async function notifyEnrolledStudents({ courseId, type, title, message, link, actorName, actorAvatar }) {
  try {
    const course = await Course.findById(courseId).select('enrolledStudents')
    if (!course || !course.enrolledStudents?.length) return

    const docs = course.enrolledStudents.map(studentId => ({
      recipient: studentId,
      type,
      title,
      message: message || '',
      link:    link    || '',
      actorName:   actorName   || '',
      actorAvatar: actorAvatar || '',
    }))
    await Notification.insertMany(docs)
  } catch (err) {
    console.error('notifyEnrolledStudents error:', err.message)
  }
}

// Create a notification for a single user
export async function notifyUser({ userId, type, title, message, link, actorName, actorAvatar }) {
  try {
    await Notification.create({ recipient: userId, type, title, message: message || '', link: link || '', actorName: actorName || '', actorAvatar: actorAvatar || '' })
  } catch (err) {
    console.error('notifyUser error:', err.message)
  }
}
