import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveClass',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    leftAt: {
        type: Date
    }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
