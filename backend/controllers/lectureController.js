import LectureSchedule from '../models/LectureSchedule.js';
import User from '../models/User.js';

// @desc    Create a new lecture schedule
// @route   POST /api/lectures/create
// @access  Private/Admin
export const createLecture = async (req, res) => {
    try {
        const { topic, description, subject, scheduledAt, duration, meetingUrl, teacher, class: classVal, batch } = req.body;

        if (!topic || !subject || !scheduledAt || !meetingUrl || !teacher || !classVal || !batch) {
            return res.status(400).json({ message: 'Please provide topic, subject, scheduled date/time, meeting URL, teacher, class, and batch' });
        }

        // Validate that the assigned teacher is a valid approved teacher
        const teacherUser = await User.findOne({ _id: teacher, role: 'teacher', isApproved: true });
        if (!teacherUser) {
            return res.status(400).json({ message: 'Invalid or unapproved teacher' });
        }

        const lecture = await LectureSchedule.create({
            topic,
            description: description || '',
            subject,
            scheduledAt,
            duration: Number(duration) || 60,
            meetingUrl,
            teacher,
            class: classVal,
            batch,
            createdBy: req.user._id
        });

        const populatedLecture = await LectureSchedule.findById(lecture._id)
            .populate('teacher', 'name email')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedLecture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all lectures relevant to the user's role
// @route   GET /api/lectures
// @access  Private
export const getLectures = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'teacher') {
            // Teachers can see only lectures assigned to them
            filter = { teacher: req.user._id };
        } else if (req.user.role === 'student') {
            // Students can see only lectures matching their class and batch
            filter = {
                class: req.user.class || 'unknown-class',
                batch: req.user.batch || 'unknown-batch'
            };
        }
        // Admins can see all lectures (filter remains empty)

        const lectures = await LectureSchedule.find(filter)
            .populate('teacher', 'name email')
            .populate('createdBy', 'name email')
            .sort({ scheduledAt: -1 });

        res.json(lectures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a lecture schedule
// @route   PUT /api/lectures/:id
// @access  Private/Admin
export const updateLecture = async (req, res) => {
    try {
        const lecture = await LectureSchedule.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture schedule not found' });
        }

        const { topic, description, subject, scheduledAt, duration, meetingUrl, teacher, class: classVal, batch } = req.body;

        if (topic) lecture.topic = topic;
        if (description !== undefined) lecture.description = description;
        if (subject) lecture.subject = subject;
        if (scheduledAt) lecture.scheduledAt = scheduledAt;
        if (duration) lecture.duration = Number(duration);
        if (meetingUrl) lecture.meetingUrl = meetingUrl;
        
        if (teacher) {
            const teacherUser = await User.findOne({ _id: teacher, role: 'teacher', isApproved: true });
            if (!teacherUser) {
                return res.status(400).json({ message: 'Invalid or unapproved teacher' });
            }
            lecture.teacher = teacher;
        }

        if (classVal) lecture.class = classVal;
        if (batch) lecture.batch = batch;

        await lecture.save();

        const updatedLecture = await LectureSchedule.findById(lecture._id)
            .populate('teacher', 'name email')
            .populate('createdBy', 'name email');

        res.json(updatedLecture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a lecture schedule
// @route   DELETE /api/lectures/:id
// @access  Private/Admin
export const deleteLecture = async (req, res) => {
    try {
        const lecture = await LectureSchedule.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture schedule not found' });
        }

        await LectureSchedule.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lecture schedule removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all approved teachers
// @route   GET /api/lectures/teachers
// @access  Private/Admin
export const getApprovedTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher', isApproved: true })
            .select('name email')
            .sort({ name: 1 });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
