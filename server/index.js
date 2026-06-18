import express        from 'express'
import { createServer } from 'http'
import { Server }       from 'socket.io'
import path             from 'path'
import { fileURLToPath } from 'url'
import cors            from 'cors'
import helmet          from 'helmet'
import cookieParser    from 'cookie-parser'
import rateLimit       from 'express-rate-limit'
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

// Socket handlers
import { registerLiveRoomSocket } from './socket/liveRoom.js'

connectDB()

const app        = express()
const httpServer = createServer(app)
const io         = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }
})

registerLiveRoomSocket(io)

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests from this IP. Try again after 15 minutes.' }
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

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'))
  })
} else {
  // 404 handler
  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }))
}

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ')
    return res.status(400).json({ success: false, message: messages })
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field'
    return res.status(409).json({ success: false, message: `${field} already exists` })
  }
  console.error(err.stack)
  const status  = err.statusCode || 500
  const message = err.message    || 'Internal server error'
  res.status(status).json({ success: false, message })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`🚀 Zenius AI server running on port ${PORT}`))
