import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  _id:       { type: mongoose.Schema.Types.ObjectId, auto: true },
  title:     { type: String, required: true },
  videoUrl:  String,
  publicId:  String,
  duration:  { type: Number, default: 0 },
  isFree:    { type: Boolean, default: false },
  resources: [{ name: String, url: String }],
  whQuestions: [{ question: String, answer: String }],
})

const sectionSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  lessons: [lessonSchema],
})

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  subtitle:    String,
  description: String,
  instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail:   String,
  previewVideo:String,
  price:       { type: Number, default: 0 },
  isFree:      { type: Boolean, default: false },
  category:    { type: String, required: true },
  tags:        [String],
  level:       { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: undefined },
  language:    { type: String, default: 'English' },
  whatYouLearn:  [String],
  requirements:  [String],
  curriculum:    [sectionSchema],
  finalExam:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalDuration:  { type: Number, default: 0 },
  totalLessons:   { type: Number, default: 0 },
  avgRating:      { type: Number, default: 0 },
  reviewCount:    { type: Number, default: 0 },
  status:      { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  isAdminApproved: { type: Boolean, default: true },
}, { timestamps: true })

courseSchema.pre('save', function () {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  let totalDuration = 0, totalLessons = 0
  for (const section of this.curriculum) {
    for (const lesson of section.lessons) {
      totalDuration += lesson.duration || 0
      totalLessons++
    }
  }
  this.totalDuration = totalDuration
  this.totalLessons  = totalLessons
  this.isFree        = this.price === 0
})

courseSchema.set('toObject', {
  transform: function (doc, ret) {
    if (ret.enrolledStudents) {
      ret.enrolledStudents = Array(ret.enrolledStudents.length).fill(null)
    }
    return ret
  }
})

courseSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (ret.enrolledStudents) {
      ret.enrolledStudents = Array(ret.enrolledStudents.length).fill(null)
    }
    return ret
  }
})

export default mongoose.model('Course', courseSchema)
