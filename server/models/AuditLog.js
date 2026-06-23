import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  admin:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminEmail:{ type: String },
  method:    { type: String, required: true },
  url:       { type: String, required: true },
  // Store a sanitized snapshot of the request body (no passwords/tokens)
  body:      { type: mongoose.Schema.Types.Mixed },
  ip:        { type: String },
  userAgent: { type: String },
}, { timestamps: true })

// Auto-delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

export default mongoose.model('AuditLog', auditLogSchema)
