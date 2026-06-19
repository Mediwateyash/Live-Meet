import express        from 'express'
import { createServer } from 'http'
import { Server }       from 'socket.io'
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

// Middlewares
import { errorHandler } from './middleware/errorHandler.js'
import { authLimiter } from './middleware/rateLimiter.js'
import { mongoSanitize } from './middleware/mongoSanitize.js'

// Socket handlers
import { registerLiveRoomSocket } from './socket/liveRoom.js'

connectDB()

const app        = express()
const httpServer = createServer(app)

const allowedOrigins = [
  'https://live-meet.onrender.com',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean)

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
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.youtube.com', 'https://*.ytimg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co', 'https://*.ytimg.com'],
        connectSrc: ["'self'", 'wss:', 'https:'],
        frameSrc: ["'self'", 'https://*.youtube.com', 'https://*.youtube-nocookie.com', 'https://player.vimeo.com'],
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
  // Relaxed headers in development for easier debugging of media embeds
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }));
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// NoSQL query sanitization
app.use(mongoSanitize)

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain')
  res.send(`User-agent: *\nDisallow: /api/\nDisallow: /admin/\nDisallow: /dashboard/\nAllow: /`)
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

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'))
  })
} else {
  // 404 handler
  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }))
}

// Global error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`🚀 Zenius AI server running on port ${PORT}`))
