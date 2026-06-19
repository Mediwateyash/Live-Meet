import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    extractedText: {
        type: String
    },
    chapterName: {
        type: String
    },
    startPage: {
        type: Number
    },
    endPage: {
        type: Number
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    error: {
        type: String
    }
}, { timestamps: true });

const Material = mongoose.model('Material', materialSchema);
export default Material;
