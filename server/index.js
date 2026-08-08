import express        from 'express'
import { createServer } from 'http'
import { Server }       from 'socket.io'
import fs               from 'fs'
import path             from 'path'
import { fileURLToPath } from 'url'
import cors            from 'cors'
import helmet          from 'helmet'
import cookieParser    from 'cookie-parser'
import 'dotenv/config'
import connectDB from './config/db.js'

// Routes
import authRoutes         from './routes/auth.js'
import userRoutes         from './routes/user.js'
import courseRoutes       from './routes/course.js'
import progressRoutes     from './routes/progress.js'
import paymentRoutes      from './routes/payment.js'
import instructorRoutes   from './routes/instructor.js'
import adminRoutes        from './routes/admin.js'
import liveLectureRoutes  from './routes/liveLecture.js'
import notificationRoutes from './routes/notification.js'
import testimonialRoutes  from './routes/testimonial.js'
import materialRoutes     from './routes/materialRoutes.js'
import mcqRoutes          from './routes/mcqRoutes.js'
import quizRoutes         from './routes/quizRoutes.js'
import resultRoutes       from './routes/resultRoutes.js'
import analyticsRoutes    from './routes/analyticsRoutes.js'
import quickQuizRoutes    from './routes/quickQuizRoutes.js'
import uploadRoutes       from './routes/uploadRoutes.js'
import whRoutes           from './routes/whRoutes.js'
import supportRoutes      from './routes/support.js'
import legalRoutes        from './routes/legalRoutes.js'
import Course             from './models/Course.js'
import { seedCybersecurityCourseIfMissing } from './utils/courseMigration.js'
import { seedLegalPages } from './controllers/legalController.js'

// Middlewares
import { errorHandler } from './middleware/errorHandler.js'
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js'
import { mongoSanitize } from './middleware/mongoSanitize.js'
import { csrfMiddleware } from './middleware/csrf.js'

// Socket handlers
import { registerLiveRoomSocket } from './socket/liveRoom.js'

connectDB().then(() => {
  seedCybersecurityCourseIfMissing()
  seedLegalPages()
})

const app        = express()
app.set('trust proxy', 1)
app.disable('x-powered-by') // Remove X-Powered-By: Express fingerprint

const httpServer = createServer(app)

// Validate CLIENT_URL is a proper absolute URL before adding to allowed origins
const isValidOrigin = (url) => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch { return false }
}

const allowedOrigins = [
  'https://live-meet.onrender.com',
  (process.env.CLIENT_URL && isValidOrigin(process.env.CLIENT_URL)) ? process.env.CLIENT_URL : null
].filter(Boolean)

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
}

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  if (origin.endsWith('.vercel.app')) return true
  if (origin.endsWith('.onrender.com')) return true
  return false
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'x-xsrf-token'],
}

const io         = new Server(httpServer, {
  cors: corsOptions,
  path: '/api/socket.io'
})

registerLiveRoomSocket(io)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.youtube.com', 'https://*.ytimg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co', 'https://*.ytimg.com', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'http://localhost:*', 'ws://localhost:*', 'https://live-meet.onrender.com', 'wss://live-meet.onrender.com', 'blob:'],
      frameSrc: ["'self'", 'https://*.youtube.com', 'https://*.youtube-nocookie.com', 'https://player.vimeo.com', 'https://res.cloudinary.com', 'https://docs.google.com'],
      mediaSrc: ["'self'", 'https://res.cloudinary.com', 'data:', 'blob:', 'https:'],
      // Required for WebRTC getUserMedia / screen capture in modern browsers
      workerSrc: ["'self'", 'blob:'],
    },
  },
  frameguard: { action: 'sameorigin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));

// Security & Permissions custom headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(csrfMiddleware)

// Rate limiting & NoSQL query sanitization (sanitize first)
app.use(mongoSanitize)
app.use('/api', apiLimiter)

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const host = req.get('host') || ''
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? req.protocol : 'https')
  const baseUrl = `${protocol}://${host}`
  res.type('text/plain')
  res.send(`User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /instructor/
Disallow: /my-learning/
Disallow: /course/*/learn
Disallow: /live/
Allow: /
Allow: /browse
Allow: /course/

Sitemap: ${baseUrl}/sitemap.xml`)
})

// Routes
app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/courses',       courseRoutes)
app.use('/api/progress',      progressRoutes)
app.use('/api/instructor',    instructorRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/live-lectures', liveLectureRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/payment',       paymentRoutes)
app.use('/api/testimonials',  testimonialRoutes)
app.use('/api/material',      materialRoutes)
app.use('/api/mcq',           mcqRoutes)
app.use('/api/quiz',          quizRoutes)
app.use('/api/result',        resultRoutes)
app.use('/api/analytics',     analyticsRoutes)
app.use('/api/quick-quiz',    quickQuizRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/wh',            whRoutes)
app.use('/api/support',       supportRoutes)
app.use('/api/legal',         legalRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Sitemap.xml dynamic route
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const host = req.get('host') || '';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? req.protocol : 'https');
    const baseUrl = `${protocol}://${host}`;

    // Get all published courses
    const courses = await Course.find({ status: 'published' }).select('slug updatedAt')

    const todayStr = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Primary Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/browse</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/forgot-password</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Legal Dynamic/Friendly Sub-pages -->
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-and-conditions</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/cookie-policy</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/refund-policy</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/disclaimer</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/acceptable-use</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/community-guidelines</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/grievance</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/copyright</loc>
    <lastmod>2026-06-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    // Dynamic course routes
    courses.forEach(course => {
      const courseUrl = `${baseUrl}/course/${course.slug}`;
      const lastMod = course.updatedAt 
        ? new Date(course.updatedAt).toISOString().split('T')[0] 
        : todayStr;
      xml += `  <url>
    <loc>${courseUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
})

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const distPath = path.join(__dirname, '../client/dist')
  
  app.use(express.static(distPath, { index: false }))
  
  app.get(/(.*)/, async (req, res, next) => {
    const indexPath = path.resolve(distPath, 'index.html')
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Application index.html shell not found')
    }

    try {
      let html = fs.readFileSync(indexPath, 'utf8')
      const host = req.get('host') || ''
      const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? req.protocol : 'https')
      const baseUrl = `${protocol}://${host}`
      const fullUrl = `${baseUrl}${req.originalUrl}`

      // XSS protection: escape all user-sourced data before HTML interpolation
      const escapeHtml = (str) => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

      // Sanitize req.path for safe use in URLs — allow only alphanumeric, hyphens, slashes, underscores
      const safePath = req.path.replace(/[^a-zA-Z0-9\-_\/]/g, '')

      // Cache-Control: prevent authenticated page responses from being cached
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')

      // Default values
      let title = 'Zenius AI — Learn Without Limits'
      let description = 'Zenius AI is a state-of-the-art AI-powered LMS platform offering smart quiz generation, live classes, and custom study notes.'
      let image = `${baseUrl}/og-image.png`
      let statusCode = 200
      let schemas = []

      // Organization Schema (default on all pages)
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Zenius AI",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.svg`,
        "description": "Zenius AI is a state-of-the-art AI-powered LMS platform offering smart quiz generation, live classes, and custom study notes."
      })

      // Check route pattern for Course detail page: /course/:slug
      const courseMatch = req.path.match(/^\/course\/([^/]+)$/)
      if (courseMatch) {
        const slug = courseMatch[1]
        const course = await Course.findOne({ slug }).populate('instructor', 'fullName')
        if (course) {
          title = `${course.title} | Zenius AI`
          description = course.subtitle || (course.description ? course.description.slice(0, 155).replace(/\s+/g, ' ').trim() + '...' : '')
          if (course.thumbnail) {
            image = course.thumbnail.startsWith('http') ? course.thumbnail : `${baseUrl}${course.thumbnail.startsWith('/') ? '' : '/'}${course.thumbnail}`
          }
          
          // 1. Course Schema
          schemas.push({
            "@context": "https://schema.org",
            "@type": "Course",
            "@id": `${baseUrl}/course/${course.slug}/#course`,
            "name": course.title,
            "description": course.description ? course.description.slice(0, 250) : '',
            "provider": {
              "@type": "Organization",
              "name": "Zenius AI",
              "sameAs": baseUrl
            },
            "author": course.instructor && course.instructor.fullName ? {
              "@type": "Person",
              "name": course.instructor.fullName
            } : {
              "@type": "Organization",
              "name": "Zenius AI"
            },
            "image": image,
            "offers": {
              "@type": "Offer",
              "price": course.price || 0,
              "priceCurrency": "INR"
            }
          })

          // 2. Breadcrumb Schema: Home > Browse Courses > Course Name
          schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": baseUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Browse Courses",
                "item": `${baseUrl}/browse`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": course.title,
                "item": `${baseUrl}/course/${course.slug}`
              }
            ]
          })
        } else {
          // SEO-friendly 404 Status Code response!
          statusCode = 404
          title = 'Course Not Found | Zenius AI'
          description = 'The requested course does not exist on Zenius AI.'
        }
      } else if (req.path === '/browse') {
        title = 'Browse Courses | Zenius AI'
        description = 'Explore professional AI-powered learning courses on Zenius AI.'

        // Breadcrumb Schema: Home > Browse Courses
        schemas.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": baseUrl
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Browse Courses",
              "item": `${baseUrl}/browse`
            }
          ]
        })
      } else if (req.path === '/' || req.path === '') {
        // 1. Website Schema (with SearchAction)
        schemas.push({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          "name": "Zenius AI",
          "url": baseUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/browse?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })

        // 2. FAQ Schema
        schemas.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is Zenius AI and who can use it?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Zenius AI is an advanced, AI-powered Learning Management System (LMS) designed for both students and instructors. Students can enroll in interactive courses, take generated quizzes, and attend live lectures, while educators can manage curriculums, host live sessions, and review student progress."
              }
            },
            {
              "@type": "Question",
              "name": "How does the AI MCQ and Test Generator work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Zenius AI features a built-in AI MCQ Generator. Instructors can select course materials or specify custom topics, and our AI automatically analyzes the context to generate multiple-choice questions, making exam creation fast and efficient."
              }
            },
            {
              "@type": "Question",
              "name": "Can students interact with instructors during Live Lectures?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Zenius AI provides a custom virtual classroom experience. Students can join scheduled live streams, access real-time video/audio controls, interact with peers and instructors via the chat dock, and view attendance metrics."
              }
            },
            {
              "@type": "Question",
              "name": "How do certificates work on Zenius AI?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Once a student successfully completes all modules of a course and passes the required course quizzes, Zenius AI automatically generates a personalized, downloadable certificate of completion that can be shared with employers."
              }
            },
            {
              "@type": "Question",
              "name": "How can I submit feedback or report a bug to the administrator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Logged-in users can open their profile menu and click 'Contact Us' (or 'Student Feedback' for admins) to submit tickets. You can categorise your request, write your feedback, and receive direct responses from platform administrators in your inbox."
              }
            }
          ]
        })
      } else {
        // Generic Breadcrumb for other pages (e.g. /login, /register, /contact)
        const pathClean = req.path.replace(/^\/|\/$/g, '')
        const pageTitleMap = {
          'login': 'Login',
          'register': 'Register',
          'forgot-password': 'Forgot Password',
          'contact': 'Contact Us',
          'about': 'About Us',
          'admin/support': 'Admin Support'
        }
        const pageName = pageTitleMap[pathClean] || (pathClean ? pathClean.charAt(0).toUpperCase() + pathClean.slice(1) : '')
        
        if (pageName && !safePath.startsWith('/api') && !safePath.startsWith('/socket.io')) {
          schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": baseUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": pageName,
                "item": `${baseUrl}${safePath}`
              }
            ]
          })
        }
      }

      const schemaScripts = schemas.map(schema => {
        const jsonString = JSON.stringify(schema)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026')
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');
        return `<script type="application/ld+json">${jsonString}</script>`;
      }).join('\n')

      // Escape all values before injecting into HTML
      const safeTitle = escapeHtml(title)
      const safeDesc  = escapeHtml(description)
      const safeImage = escapeHtml(image)
      const safeUrl   = escapeHtml(fullUrl)

      const seoTags = `
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImage}" />
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${safeUrl}" />
    <meta property="twitter:title" content="${safeTitle}" />
    <meta property="twitter:description" content="${safeDesc}" />
    <meta property="twitter:image" content="${safeImage}" />
    <!-- Schema Markup -->
    ${schemaScripts}
  `

      // Replace default Title tag
      html = html.replace(/<title>.*?<\/title>/g, `<title>${safeTitle}</title>`)
      // Inject tags before </head>
      html = html.replace('</head>', `${seoTags}\n  </head>`)

      res.status(statusCode).send(html)
    } catch (err) {
      next(err)
    }
  })
} else {
  // 404 handler
  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }))
}

// Global error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`🚀 Zenius AI server running on port ${PORT}`))
// trigger
