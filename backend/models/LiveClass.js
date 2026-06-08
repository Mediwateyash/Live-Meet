import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        default: ''
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // duration in minutes
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'ended'],
        default: 'scheduled'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    }
}, { timestamps: true });

const LiveClass = mongoose.model('LiveClass', liveClassSchema);
export default LiveClass;
