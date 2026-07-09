import mongoose from 'mongoose';

const whQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    topic: {
        type: String,
        required: false
    }
}, { timestamps: true });

const WHQuestion = mongoose.model('WHQuestion', whQuestionSchema);
export default WHQuestion;
