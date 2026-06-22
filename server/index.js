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
import supportRoutes      from './routes/support.js'
import Course             from './models/Course.js'


// Middlewares
import { errorHandler } from './middleware/errorHandler.js'
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js'
import { mongoSanitize } from './middleware/mongoSanitize.js'

// Socket handlers
import { registerLiveRoomSocket } from './socket/liveRoom.js'

connectDB()

const app        = express()
app.set('trust proxy', 1)

const httpServer = createServer(app)

const allowedOrigins = [
  'https://live-meet.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean)

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const io         = new Server(httpServer, {
  cors: corsOptions
})

registerLiveRoomSocket(io)

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://*.youtube.com', 'https://*.ytimg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co', 'https://*.ytimg.com'],
        connectSrc: ["'self'", 'wss:', 'https:'],
        frameSrc: ["'self'", 'https://*.youtube.com', 'https://*.youtube-nocookie.com', 'https://player.vimeo.com', 'https://res.cloudinary.com', 'https://docs.google.com'],
        mediaSrc: ["'self'", 'https://res.cloudinary.com', 'data:', 'blob:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,      // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));
} else {
  // Enforce security headers in development but relax CSP/CORP for local embeds
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.youtube.com', 'https://*.ytimg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co', 'https://*.ytimg.com'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
        frameSrc: ["'self'", 'https://*.youtube.com', 'https://*.youtube-nocookie.com', 'https://player.vimeo.com', 'https://res.cloudinary.com', 'https://docs.google.com'],
        mediaSrc: ["'self'", 'https://res.cloudinary.com', 'data:', 'blob:'],
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Rate limiting & NoSQL query sanitization (sanitize first)
app.use(mongoSanitize)
app.use('/api', apiLimiter)

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const protocol = req.protocol
  const host = req.get('host')
  const baseUrl = `${protocol}://${host}`
  res.type('text/plain')
  res.send(`User-agent: *\nDisallow: /api/\nDisallow: /admin/\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml`)
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
app.use('/api/testimonials',  testimonialRoutes)
app.use('/api/material',      materialRoutes)
app.use('/api/mcq',           mcqRoutes)
app.use('/api/quiz',          quizRoutes)
app.use('/api/result',        resultRoutes)
app.use('/api/analytics',     analyticsRoutes)
app.use('/api/quick-quiz',    quickQuizRoutes)
app.use('/api/upload',        uploadRoutes)
app.use('/api/support',       supportRoutes)


// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Sitemap.xml dynamic route
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Get all published courses
    const courses = await Course.find({ status: 'published' }).select('slug updatedAt')

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/browse</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
`;

    // Dynamic course routes
    courses.forEach(course => {
      const courseUrl = `${baseUrl}/course/${course.slug}`;
      const lastMod = course.updatedAt 
        ? new Date(course.updatedAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      xml += `  <url>
    <loc>${courseUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
  
  app.use(express.static(distPath))
  
  app.get(/(.*)/, async (req, res, next) => {
    const indexPath = path.resolve(distPath, 'index.html')
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Application index.html shell not found')
    }

    try {
      let html = fs.readFileSync(indexPath, 'utf8')
      const protocol = req.protocol
      const host = req.get('host')
      const baseUrl = `${protocol}://${host}`
      const fullUrl = `${baseUrl}${req.originalUrl}`

      // Default values
      let title = 'Zenius AI — Learn Without Limits'
      let description = 'Zenius AI is a state-of-the-art AI-powered LMS platform offering smart quiz generation, live classes, and custom study notes.'
      let image = `${baseUrl}/favicon.svg`
      let statusCode = 200
      let schemaJson = {
        "@context": "https://schema.org",
        "@type": "OnlineBusiness",
        "name": "Zenius AI",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.svg`,
        "description": description
      }

      // Check route pattern for Course detail page: /course/:slug
      const courseMatch = req.path.match(/^\/course\/([^/]+)$/)
      if (courseMatch) {
        const slug = courseMatch[1]
        const course = await Course.findOne({ slug }).populate('instructor', 'fullName')
        if (course) {
          title = `${course.title} | Zenius AI`
          description = course.subtitle || (course.description ? course.description.slice(0, 155).replace(/\s+/g, ' ').trim() + '...' : '')
          if (course.thumbnail) {
            image = course.thumbnail
          }
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": course.title,
            "description": course.description ? course.description.slice(0, 250) : '',
            "provider": {
              "@type": "Organization",
              "name": "Zenius AI",
              "sameAs": baseUrl
            },
            "image": image,
            "offers": {
              "@type": "Offer",
              "price": course.price || 0,
              "priceCurrency": "INR"
            }
          }
        } else {
          // SEO-friendly 404 Status Code response!
          statusCode = 404
          title = 'Course Not Found | Zenius AI'
          description = 'The requested course does not exist on Zenius AI.'
        }
      } else if (req.path === '/browse') {
        title = 'Browse Courses | Zenius AI'
        description = 'Explore professional AI-powered learning courses on Zenius AI.'
      }

      const seoTags = `
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${fullUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${fullUrl}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${image}" />
    <!-- Schema Markup -->
    <script type="application/ld+json">
      ${JSON.stringify(schemaJson, null, 2)}
    </script>
  `

      // Replace default Title tag
      html = html.replace(/<title>.*?<\/title>/g, `<title>${title}</title>`)
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
