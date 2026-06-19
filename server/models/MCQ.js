import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    topic: {
        type: String,
        required: false
    }
}, { timestamps: true });

const MCQ = mongoose.model('MCQ', mcqSchema);
export default MCQ;
