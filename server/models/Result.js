import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    answers: [{
        mcqId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MCQ'
        },
        selected: {
            type: String
        }
    }]
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);
export default Result;
