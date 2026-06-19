import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    mcqIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MCQ'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timer: {
        type: Number, // duration in minutes
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
