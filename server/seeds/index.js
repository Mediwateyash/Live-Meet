import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import User from '../models/User.js'
import Course from '../models/Course.js'
import InstructorRequest from '../models/InstructorRequest.js'
import Progress from '../models/Progress.js'
import Review from '../models/Review.js'
import LiveLecture from '../models/LiveLecture.js'

const COURSES_DATA = [
  {
    title: 'Modern Web Development Bootcamp',
    subtitle: 'Master HTML, CSS, JavaScript, React and Node.js.',
    description: 'Learn full-stack web development from scratch. This course takes you from frontend design to backend APIs using modern paradigms, React, Express, and MongoDB.',
    price: 499,
    category: 'Web Development',
    tags: ['HTML', 'JavaScript', 'React', 'Node.js'],
    level: 'Beginner',
    language: 'English',
    whatYouLearn: ['Build responsive frontend apps', 'Design REST APIs', 'Understand database architecture', 'Deploy full-stack websites'],
    requirements: ['No prior experience required'],
    curriculum: [{
      title: 'Getting Started',
      lessons: [
        { title: 'Course Roadmap', duration: 300, isFree: true },
        { title: 'Setting Up Your Environment', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Data Science and Analytics Fundamentals',
    subtitle: 'Learn data analysis, visualization, and statistics with Python.',
    description: 'Understand the foundations of data science. You will learn to clean, analyze, and visualize data using Python, Pandas, NumPy, and Matplotlib.',
    price: 599,
    category: 'Data Science',
    tags: ['Python', 'Pandas', 'NumPy', 'Data Visualization'],
    level: 'Intermediate',
    language: 'English',
    whatYouLearn: ['Write python clean code', 'Manipulate tabular data', 'Generate professional plots', 'Understand statistical tests'],
    requirements: ['Basic python syntax knowledge'],
    curriculum: [{
      title: 'Introduction to Data Science',
      lessons: [
        { title: 'Course Overview', duration: 300, isFree: true },
        { title: 'Pandas Basics', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Machine Learning Foundations',
    subtitle: 'Build, train, and deploy supervised and unsupervised models.',
    description: 'Explore the foundations of Machine Learning. You will learn model selection, regularization, regression, classification, and clustering.',
    price: 699,
    category: 'AI / ML',
    tags: ['ML', 'Python', 'Scikit-learn', 'Regression'],
    level: 'Intermediate',
    language: 'English',
    whatYouLearn: ['Build linear regression models', 'Understand training/test splits', 'Apply clustering algorithms', 'Evaluate model performance'],
    requirements: ['Basic Python and algebra'],
    curriculum: [{
      title: 'Introduction to Machine Learning',
      lessons: [
        { title: 'What is ML?', duration: 300, isFree: true },
        { title: 'Supervised vs Unsupervised Learning', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'UI/UX Design Essentials',
    subtitle: 'Master wireframing, prototyping, and Figma for premium user experience.',
    description: 'Learn wireframing, prototyping, user flows, and interface creation. Master Figma and build state-of-the-art responsive mobile and web layouts.',
    price: 399,
    category: 'Design',
    tags: ['UI', 'UX', 'Figma', 'Prototyping'],
    level: 'Beginner',
    language: 'English',
    whatYouLearn: ['Master Figma layouts', 'Design high-fidelity mockups', 'Understand user persona design', 'Perform user testing'],
    requirements: ['No design tools experience required'],
    curriculum: [{
      title: 'Introduction to UI/UX Design',
      lessons: [
        { title: 'Figma Canvas Basics', duration: 300, isFree: true },
        { title: 'Designing Your First Button', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Digital Marketing Strategy Mastery',
    subtitle: 'SEO, SEM, Social Media, and Content Marketing tactics.',
    description: 'Learn digital marketing principles. Setup search engine optimization (SEO), search engine ads (SEM), copy campaigns, and track analytics.',
    price: 449,
    category: 'Marketing',
    tags: ['Marketing', 'SEO', 'SEM', 'Analytics'],
    level: 'Beginner',
    language: 'English',
    whatYouLearn: ['Audit website SEO', 'Run ad word campaigns', 'Design social media schedules', 'Track conversion funnels'],
    requirements: ['Basic computer literacy'],
    curriculum: [{
      title: 'Digital Marketing Landscape',
      lessons: [
        { title: 'Introduction to SEO', duration: 300, isFree: true },
        { title: 'Understanding Keywords', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Cloud Architecture Fundamentals',
    subtitle: 'Learn AWS, cloud security, and deployment infrastructure.',
    description: 'Learn AWS cloud computing, storage, compute structures, virtual private clouds, IAM roles, security architectures, and scalable deployments.',
    price: 649,
    category: 'Cloud',
    tags: ['Cloud', 'AWS', 'IAM', 'VPC'],
    level: 'Intermediate',
    language: 'English',
    whatYouLearn: ['Setup EC2 instances', 'Understand S3 storage buckets', 'Design virtual networks (VPC)', 'Manage identity access roles (IAM)'],
    requirements: ['Basic networking concepts'],
    curriculum: [{
      title: 'AWS Basics',
      lessons: [
        { title: 'Global Infrastructure Overview', duration: 300, isFree: true },
        { title: 'EC2 Compute Engine Setup', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Practical Cybersecurity & Hacking Defenses',
    subtitle: 'Defend networks, systems, and applications from cyber attacks.',
    description: 'Learn network vulnerability assessments, firewalls, threat intelligence, security models, malware analysis, and defenses against top web attacks.',
    price: 549,
    category: 'Cybersecurity',
    tags: ['Cybersecurity', 'Hacking', 'Defense', 'Security'],
    level: 'Intermediate',
    language: 'English',
    whatYouLearn: ['Understand network architecture vulnerabilities', 'Apply symmetric & asymmetric encryption', 'Build host firewall configurations', 'Analyze malware types'],
    requirements: ['Basic computer literacy'],
    curriculum: [{
      title: 'Cybersecurity Principles',
      lessons: [
        { title: 'The CIA Triad Explained', duration: 300, isFree: true },
        { title: 'Network Scanners Basics', duration: 600, isFree: true }
      ]
    }]
  },
  {
    title: 'Business Management & Leadership Essentials',
    subtitle: 'Project management, agile methodology, and team leadership.',
    description: 'Learn modern business operations, agile development methodologies, scrum project frameworks, team motivation, and leadership structures.',
    price: 499,
    category: 'Business',
    tags: ['Business', 'Management', 'Agile', 'Scrum'],
    level: 'Beginner',
    language: 'English',
    whatYouLearn: ['Structure scrum sprints', 'Lead collaborative team projects', 'Build timeline metrics', 'Manage customer relationships'],
    requirements: ['Basic workplace communication'],
    curriculum: [{
      title: 'Agile Business Operations',
      lessons: [
        { title: 'Introduction to Scrum', duration: 300, isFree: true },
        { title: 'Creating User Stories', duration: 600, isFree: true }
      ]
    }]
  }
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
      LiveLecture.deleteMany({}),
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

    // Create 2 instructors matching the live website
    const [inst1, inst2] = await Promise.all([
      User.create({
        fullName: 'Yash Diwate',
        email: 'yash@gmail.com',
        password: 'Instructor@2026',
        role: 'instructor',
        isApprovedInstructor: true,
        instructorRequestStatus: 'approved',
        bio: 'Cybersecurity and Cloud specialist.',
        expertise: ['Cybersecurity', 'Cloud', 'Business']
      }),
      User.create({
        fullName: 'Aniket',
        email: 'aniketkakad@gmail.com',
        password: 'Instructor@2026',
        role: 'instructor',
        isApprovedInstructor: true,
        instructorRequestStatus: 'approved',
        bio: 'Web Developer and AI engineer.',
        expertise: ['React', 'Node.js', 'AI / ML']
      }),
    ])
    console.log('✅ Instructors created')

    // Create 5 students
    const students = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        User.create({ fullName: `Student ${i + 1}`, email: `student${i + 1}@zenius.ai`, password: 'Student@2026', role: 'student' })
      )
    )
    console.log('✅ Students created')

    // Create courses distributed between yash@gmail.com (inst1) and aniketkakad@gmail.com (inst2)
    // 8 courses: index 0, 2, 4, 6 -> inst2 (Aniket), index 1, 3, 5, 7 -> inst1 (Yash)
    const instructors = [inst2, inst1, inst2, inst1, inst2, inst1, inst2, inst1]
    const courses = await Promise.all(
      COURSES_DATA.map((data, i) => {
        let thumbnail = "";
        if (data.title === "UI/UX Design Essentials") {
          thumbnail = "/course_uiux.jpg";
        } else if (data.title === "Digital Marketing Strategy Mastery") {
          thumbnail = "/course_digital_marketing.jpg";
        } else if (data.title === "Machine Learning Foundations") {
          thumbnail = "/course_machine_learning.jpg";
        } else if (data.title === "Data Science and Analytics Fundamentals") {
          thumbnail = "/course_data_science.jpg";
        } else if (data.title === "Modern Web Development Bootcamp") {
          thumbnail = "/course_node_1781720900805.webp";
        }
        return Course.create({
          ...data,
          instructor: instructors[i]._id,
          status: 'published',
          thumbnail: thumbnail,
          isAdminApproved: true
        })
      })
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

    console.log('\n🎉 Seed complete!')
    console.log('Admin:      admin@zenius.ai / Admin@2026')
    console.log('Instructor Yash:   yash@gmail.com / Instructor@2026')
    console.log('Instructor Aniket: aniketkakad@gmail.com / Instructor@2026')
    console.log('Student:    student1@zenius.ai / Student@2026')
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()
