import Course from '../models/Course.js'
import User from '../models/User.js'

export async function seedCybersecurityCourseIfMissing() {
  try {
    // 0. Update manually promoted instructors who are missing isApprovedInstructor: true
    const promotedResult = await User.updateMany(
      { role: 'instructor', isApprovedInstructor: { $ne: true } },
      { $set: { isApprovedInstructor: true, instructorRequestStatus: 'approved' } }
    )
    if (promotedResult.modifiedCount > 0) {
      console.log(`🛡️ Updated ${promotedResult.modifiedCount} manually promoted instructors to approved status.`)
    }

    // 1. Ensure the two instructors exist (create fallback if not found in db, e.g. on localhost)
    let instYash = await User.findOne({ email: 'yash@gmail.com' })
    if (!instYash) {
      instYash = await User.create({
        fullName: 'Yash Diwate',
        email: 'yash@gmail.com',
        password: 'Instructor@2026', // userSchema.pre('save') handles hashing
        role: 'instructor',
        isApprovedInstructor: true,
        instructorRequestStatus: 'approved',
        bio: 'Cybersecurity and Cloud specialist.',
        expertise: ['Cybersecurity', 'Cloud', 'Business']
      })
      console.log('🛡️ Created fallback instructor Yash:', instYash.email)
    }

    let instAniket = await User.findOne({ email: 'aniketkakad@gmail.com' })
    if (!instAniket) {
      instAniket = await User.create({
        fullName: 'Aniket',
        email: 'aniketkakad@gmail.com',
        password: 'Instructor@2026',
        role: 'instructor',
        isApprovedInstructor: true,
        instructorRequestStatus: 'approved',
        bio: 'Web Developer and AI engineer.',
        expertise: ['React', 'Node.js', 'AI / ML']
      })
      console.log('🛡️ Created fallback instructor Aniket:', instAniket.email)
    }

    // 2. Define the 8 courses mapped to categories, split between the 2 instructors
    const coursesToMigrate = [
      {
        title: 'Modern Web Development Bootcamp',
        slug: 'modern-web-development-bootcamp',
        subtitle: 'Master HTML, CSS, JavaScript, React and Node.js.',
        description: 'Learn full-stack web development from scratch. This course takes you from frontend design to backend APIs using modern paradigms, React, Express, and MongoDB.',
        instructorId: instAniket._id,
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
        slug: 'data-science-and-analytics-fundamentals',
        subtitle: 'Learn data analysis, visualization, and statistics with Python.',
        description: 'Understand the foundations of data science. You will learn to clean, analyze, and visualize data using Python, Pandas, NumPy, and Matplotlib.',
        instructorId: instYash._id,
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
        slug: 'machine-learning-foundations',
        subtitle: 'Build, train, and deploy supervised and unsupervised models.',
        description: 'Explore the foundations of Machine Learning. You will learn model selection, regularization, regression, classification, and clustering.',
        instructorId: instAniket._id,
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
        slug: 'ui-ux-design-essentials',
        subtitle: 'Master wireframing, prototyping, and Figma for premium user experience.',
        description: 'Learn wireframing, prototyping, user flows, and interface creation. Master Figma and build state-of-the-art responsive mobile and web layouts.',
        instructorId: instYash._id,
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
        slug: 'digital-marketing-strategy-mastery',
        subtitle: 'SEO, SEM, Social Media, and Content Marketing tactics.',
        description: 'Learn digital marketing principles. Setup search engine optimization (SEO), search engine ads (SEM), copy campaigns, and track analytics.',
        instructorId: instAniket._id,
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
        slug: 'cloud-architecture-fundamentals',
        subtitle: 'Learn AWS, cloud security, and deployment infrastructure.',
        description: 'Learn AWS cloud computing, storage, compute structures, virtual private clouds, IAM roles, security architectures, and scalable deployments.',
        instructorId: instYash._id,
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
        slug: 'practical-cybersecurity-hacking-defenses',
        subtitle: 'Defend networks, systems, and applications from cyber attacks.',
        description: 'Learn network vulnerability assessments, firewalls, threat intelligence, security models, malware analysis, and defenses against top web attacks.',
        instructorId: instAniket._id,
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
        slug: 'business-management-leadership-essentials',
        subtitle: 'Project management, agile methodology, and team leadership.',
        description: 'Learn modern business operations, agile development methodologies, scrum project frameworks, team motivation, and leadership structures.',
        instructorId: instYash._id,
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

    // 3. Insert each course if it does not already exist
    for (const c of coursesToMigrate) {
      const exists = await Course.findOne({ slug: c.slug })
      if (exists) {
        console.log(`🛡️ Course "${c.title}" already exists.`)
        continue
      }

      console.log(`🛡️ Course "${c.title}" not found. Inserting...`)
      await Course.create({
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        instructor: c.instructorId,
        thumbnail: "", // no images as requested
        price: c.price,
        isFree: false,
        category: c.category,
        tags: c.tags,
        level: c.level,
        language: c.language,
        whatYouLearn: c.whatYouLearn,
        requirements: c.requirements,
        curriculum: c.curriculum,
        status: 'published',
        isAdminApproved: true
      })
      console.log(`🛡️ Created course: "${c.title}"`)
    }
  } catch (err) {
    console.error('❌ Failed to seed courses:', err)
  }
}
