import mongoose from 'mongoose';

const lectureScheduleSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // In minutes
        required: true,
        default: 60
    },
    meetingUrl: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const LectureSchedule = mongoose.model('LectureSchedule', lectureScheduleSchema);
export default LectureSchedule;
