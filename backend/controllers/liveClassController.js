import LiveClass from '../models/LiveClass.js';
import Attendance from '../models/Attendance.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

export const createLiveClass = async (req, res) => {
    try {
        const { title, description, subject, scheduledAt, duration, class: classVal, batch, teacher } = req.body;

        if (!title || !scheduledAt || !duration || !classVal || !batch) {
            return res.status(400).json({ message: 'Please provide title, scheduled date/time, duration, class, and batch' });
        }

        if (new Date(scheduledAt) < new Date()) {
            return res.status(400).json({ message: 'Scheduled date/time must be in the future' });
        }

        // Validate teacher if provided
        if (teacher) {
            const teacherUser = await User.findOne({ _id: teacher, role: 'teacher', isApproved: true });
            if (!teacherUser) {
                return res.status(400).json({ message: 'Invalid or unapproved teacher' });
            }
        }

        const liveClass = await LiveClass.create({
            title,
            description: description || '',
            subject: subject || '',
            scheduledAt,
            duration,
            createdBy: req.user._id,
            teacher: teacher || req.user._id,
            class: classVal,
            batch
        });

        const populatedClass = await LiveClass.findById(liveClass._id)
            .populate('createdBy', 'name email')
            .populate('teacher', 'name email');

        res.status(201).json(populatedClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLiveClasses = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'teacher') {
            // Teachers see classes they created OR are assigned to
            filter = { $or: [{ createdBy: req.user._id }, { teacher: req.user._id }] };
        } else if (req.user.role === 'student') {
            // Students only see classes matching their class + batch
            filter = {
                class: req.user.class || '__no_match__',
                batch: req.user.batch || '__no_match__'
            };
        }
        // Admins see all classes (filter remains empty)
        const classes = await LiveClass.find(filter)
            .populate('createdBy', 'name email')
            .populate('teacher', 'name email')
            .sort({ scheduledAt: -1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLiveClassById = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('teacher', 'name email');
        if (!liveClass) {
            return res.status(404).json({ message: 'Live class not found' });
        }

        // Access control: students can only view their own class/batch
        if (req.user.role === 'student') {
            if (liveClass.class !== req.user.class || liveClass.batch !== req.user.batch) {
                return res.status(403).json({ message: 'Access denied. This class is not assigned to your division.' });
            }
        }

        // Access control: teachers can only view classes they created or are assigned to
        if (req.user.role === 'teacher') {
            const isOwner = liveClass.createdBy?._id?.toString() === req.user._id.toString();
            const isAssigned = liveClass.teacher?._id?.toString() === req.user._id.toString();
            if (!isOwner && !isAssigned) {
                return res.status(403).json({ message: 'Access denied. This class is not assigned to you.' });
            }
        }

        res.json(liveClass);
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

        const { title, description, subject, scheduledAt, duration, class: classVal, batch, teacher } = req.body;
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
        if (classVal) liveClass.class = classVal;
        if (batch) liveClass.batch = batch;
        if (teacher) {
            const teacherUser = await User.findOne({ _id: teacher, role: 'teacher', isApproved: true });
            if (!teacherUser) {
                return res.status(400).json({ message: 'Invalid or unapproved teacher' });
            }
            liveClass.teacher = teacher;
        }

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

// @desc    Validate if user can join a live class (pre-join gate)
// @route   POST /api/live-class/:id/validate-join
// @access  Private
export const validateJoinClass = async (req, res) => {
    try {
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) {
            return res.status(404).json({ allowed: false, message: 'Class not found' });
        }

        // Admin always allowed
        if (req.user.role === 'admin') {
            return res.json({ allowed: true });
        }

        // Teacher: must be creator or assigned teacher
        if (req.user.role === 'teacher') {
            const isOwner = liveClass.createdBy?.toString() === req.user._id.toString();
            const isAssigned = liveClass.teacher?.toString() === req.user._id.toString();
            if (!isOwner && !isAssigned) {
                return res.status(403).json({ allowed: false, message: 'You are not assigned to this class.' });
            }
            return res.json({ allowed: true });
        }

        // Student: must match class + batch, and class must not be ended
        if (req.user.role === 'student') {
            if (liveClass.class !== req.user.class || liveClass.batch !== req.user.batch) {
                return res.status(403).json({
                    allowed: false,
                    message: 'Access denied. This lecture belongs to a different class/division.'
                });
            }
            if (liveClass.status === 'ended') {
                return res.status(403).json({ allowed: false, message: 'This class has already ended.' });
            }
            return res.json({ allowed: true });
        }

        return res.status(403).json({ allowed: false, message: 'Unknown role.' });
    } catch (error) {
        res.status(500).json({ allowed: false, message: error.message });
    }
};
