import mongoose from 'mongoose';

const courseInsightCacheSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true 
  },
  contextHash: {
    type: String,
    required: true
  },
  insightsData: {
    summary: String,
    insights: [{
      type: { type: String, enum: ['warning', 'positive', 'information'] },
      category: { type: String, enum: ['attendance', 'progress', 'assessment', 'video', 'engagement'] },
      title: String,
      message: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] }
    }],
    recommendations: [{
      title: String,
      reason: String,
      priority: { type: String, enum: ['high', 'medium', 'low'] },
      category: { type: String, enum: ['attendance', 'progress', 'assessment', 'video', 'engagement'] }
    }]
  },
  generatedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// TTL index to automatically clear expired caches
courseInsightCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fast lookup
courseInsightCacheSchema.index({ courseId: 1, contextHash: 1 });

const CourseInsightCache = mongoose.model('CourseInsightCache', courseInsightCacheSchema);

export default CourseInsightCache;
