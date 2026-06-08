import LiveClass from '../models/LiveClass.js';
import Attendance from '../models/Attendance.js';
import ChatMessage from '../models/ChatMessage.js';

export const createLiveClass = async (req, res) => {
    try {
        const { title, description, subject, scheduledAt, duration } = req.body;

        if (!title || !scheduledAt || !duration) {
            return res.status(400).json({ message: 'Please provide title, scheduled date/time, and duration' });
        }

        if (new Date(scheduledAt) < new Date()) {
            return res.status(400).json({ message: 'Scheduled date/time must be in the future' });
        }

        const liveClass = await LiveClass.create({
            title,
            description: description || '',
            subject: subject || '',
            scheduledAt,
            duration,
            createdBy: req.user._id
        });

        res.status(201).json(liveClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLiveClasses = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'teacher') {
            filter = { createdBy: req.user._id };
        }
        // Students & admins see all classes
        const classes = await LiveClass.find(filter)
            .populate('createdBy', 'name email')
            .sort({ scheduledAt: -1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLiveClassById = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id)
            .populate('createdBy', 'name email');
        if (liveClass) {
            res.json(liveClass);
        } else {
            res.status(404).json({ message: 'Live class not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLiveClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        if (liveClass.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this class' });
        }

        if (liveClass.status !== 'scheduled') {
            return res.status(400).json({ message: 'Can only edit scheduled classes' });
        }

        const { title, description, subject, scheduledAt, duration } = req.body;
        if (title) liveClass.title = title;
        if (description !== undefined) liveClass.description = description;
        if (subject !== undefined) liveClass.subject = subject;
        if (scheduledAt) {
            if (new Date(scheduledAt) < new Date()) {
                return res.status(400).json({ message: 'Scheduled date/time must be in the future' });
            }
            liveClass.scheduledAt = scheduledAt;
        }
        if (duration) liveClass.duration = duration;

        await liveClass.save();
        res.json(liveClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteLiveClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        if (liveClass.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }

        await LiveClass.findByIdAndDelete(req.params.id);
        // Clean up related data
        await Attendance.deleteMany({ classId: req.params.id });
        await ChatMessage.deleteMany({ classId: req.params.id });
        res.json({ message: 'Live class removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const startLiveClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        if (liveClass.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to start this class' });
        }

        if (liveClass.status === 'live') {
            return res.status(400).json({ message: 'Class is already live' });
        }
        if (liveClass.status === 'ended') {
            return res.status(400).json({ message: 'Class has already ended' });
        }

        liveClass.status = 'live';
        liveClass.startedAt = new Date();
        await liveClass.save();
        res.json(liveClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const endLiveClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) return res.status(404).json({ message: 'Live class not found' });

        if (liveClass.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to end this class' });
        }

        if (liveClass.status !== 'live') {
            return res.status(400).json({ message: 'Class is not currently live' });
        }

        liveClass.status = 'ended';
        liveClass.endedAt = new Date();
        await liveClass.save();
        res.json(liveClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }

        const attendanceRecords = await Attendance.find({ classId: req.params.id })
            .populate('studentId', 'name email')
            .sort({ joinedAt: 1 });

        const studentMap = {};
        const classEndedAt = liveClass.endedAt || new Date();

        for (const record of attendanceRecords) {
            if (!record.studentId) continue;
            const studentIdStr = record.studentId._id.toString();

            if (!studentMap[studentIdStr]) {
                studentMap[studentIdStr] = {
                    studentId: record.studentId,
                    joinedAt: record.joinedAt,
                    leftAt: record.leftAt || classEndedAt,
                    totalDurationMs: 0
                };
            }

            const sessionLeftAt = record.leftAt || classEndedAt;
            const sessionDuration = sessionLeftAt.getTime() - new Date(record.joinedAt).getTime();
            
            studentMap[studentIdStr].totalDurationMs += sessionDuration > 0 ? sessionDuration : 0;
            studentMap[studentIdStr].leftAt = record.leftAt || classEndedAt;
        }

        const aggregatedAttendance = Object.values(studentMap).map(studentData => {
            return {
                _id: studentData.studentId._id,
                studentId: studentData.studentId,
                joinedAt: studentData.joinedAt,
                leftAt: studentData.leftAt,
                totalDurationMin: Math.round(studentData.totalDurationMs / 60000)
            };
        });

        res.json(aggregatedAttendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const messages = await ChatMessage.find({ 
            classId: req.params.id,
            $or: [
                { recipientId: null },
                { recipientId: { $exists: false } },
                { senderId: userId },
                { recipientId: userId }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
