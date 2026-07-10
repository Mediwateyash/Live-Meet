import mongoose from 'mongoose';

const videoSyncBatchSchema = new mongoose.Schema({
  syncId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // TTL: Automatically delete document after 24 hours
  }
});

const VideoSyncBatch = mongoose.model('VideoSyncBatch', videoSyncBatchSchema);

export default VideoSyncBatch;
