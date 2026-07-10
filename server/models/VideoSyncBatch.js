import mongoose from 'mongoose';

const videoSyncBatchSchema = new mongoose.Schema({
  syncId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingStartedAt: { type: Date },
  completedAt: { type: Date },
  failedAt: { type: Date },
  attemptCount: { type: Number, default: 1 },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // TTL: Automatically delete document after 24 hours
  }
}, { timestamps: true });

const VideoSyncBatch = mongoose.model('VideoSyncBatch', videoSyncBatchSchema);

export default VideoSyncBatch;
