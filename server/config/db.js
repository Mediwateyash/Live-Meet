import mongoose from 'mongoose'
import dns from 'dns'

export default async function connectDB() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4'])
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}
