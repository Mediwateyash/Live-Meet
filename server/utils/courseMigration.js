import Course from '../models/Course.js'
import User from '../models/User.js'

export async function seedCybersecurityCourseIfMissing() {
  try {
    const slug = 'introduction-to-cybersecurity'
    const exists = await Course.findOne({ slug })
    if (exists) {
      console.log('🛡️ Cybersecurity course already exists.')
      return
    }

    console.log('🛡️ Cybersecurity course not found. Initializing insertion...')

    // 1. Find an instructor
    let instructor = await User.findOne({ role: 'instructor', isApprovedInstructor: true })
    if (!instructor) {
      instructor = await User.findOne({ role: 'admin' })
    }
    if (!instructor) {
      // Create a default instructor (Priya Sharma, matching seeds)
      instructor = await User.create({
        fullName: 'Priya Sharma',
        email: 'priya@zenius.ai',
        password: 'Instructor@2026', // userSchema.pre('save') handles hashing
        role: 'instructor',
        isApprovedInstructor: true,
        instructorRequestStatus: 'approved',
        bio: 'Senior React developer and Security Specialist.',
        expertise: ['React', 'JavaScript', 'Cybersecurity']
      })
      console.log('🛡️ Default instructor created:', instructor.email)
    }

    // 2. Create the Cybersecurity course
    const courseData = {
      title: 'Introduction to Cybersecurity',
      subtitle: 'Learn the fundamentals of cybersecurity, network security, and cryptography.',
      description: 'Master the core concepts of cybersecurity, starting from confidentiality, integrity, and availability (CIA triad). You will learn about network vulnerabilities, cryptography basics, firewalls, and how to defend against common cyber threats.',
      instructor: instructor._id,
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400',
      price: 499,
      isFree: false,
      category: 'Cybersecurity',
      tags: ['Security', 'Network', 'Cyber', 'Ethical Hacking'],
      level: 'Beginner',
      language: 'English',
      whatYouLearn: [
        'Core security principles (CIA Triad)',
        'Types of cyber attacks and defenses',
        'Basic Cryptography (Symmetric & Asymmetric)',
        'Network security fundamentals'
      ],
      requirements: ['Basic computer literacy'],
      curriculum: [
        {
          title: 'Introduction to Cyber Security',
          lessons: [
            { title: 'Course Overview', duration: 300, isFree: true },
            { title: 'What is Cybersecurity?', duration: 600, isFree: true },
            { title: 'The CIA Triad Explained', duration: 750, isFree: false }
          ]
        }
      ],
      status: 'published',
      isAdminApproved: true
    }

    const course = await Course.create(courseData)
    console.log('🛡️ Cybersecurity course created successfully:', course.title)
  } catch (err) {
    console.error('❌ Failed to seed Cybersecurity course:', err)
  }
}
