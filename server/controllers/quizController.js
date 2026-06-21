import Quiz from '../models/Quiz.js';
import MCQ from '../models/MCQ.js';

export const createQuiz = async (req, res) => {
    try {
        const { title, mcqIds, timer, courseId } = req.body;

        if (!title || !mcqIds || mcqIds.length === 0 || !timer || !courseId) {
            return res.status(400).json({ message: 'Please provide title, mcqs, timer, and courseId' });
        }

        const visibility = req.user.role === 'student' ? 'private' : 'public';

        const quiz = await Quiz.create({
            title,
            mcqIds,
            timer,
            courseId,
            createdBy: req.user._id,
            visibility
        });

        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        // Teacher sees their own, Students see public + their own private ones
        let filter = {};
        if (req.query.courseId) {
            filter.courseId = req.query.courseId;
        }
        if (req.user.role === 'instructor' || req.user.role === 'teacher') {
            filter.createdBy = req.user._id;
        } else if (req.user.role === 'student') {
            if (!req.query.courseId) {
                // If fetching globally, only show quizzes for enrolled courses
                // Or private quizzes created by the student (which might not have a courseId)
                filter.$or = [
                    { 
                        courseId: { $in: req.user.enrolledCourses || [] },
                        visibility: 'public' 
                    },
                    { 
                        courseId: { $in: req.user.enrolledCourses || [] },
                        visibility: { $exists: false } 
                    },
                    { visibility: 'private', createdBy: req.user._id }
                ];
            } else {
                // If fetching for a specific course, just check visibility
                filter.$or = [
                    { visibility: 'public' },
                    { visibility: { $exists: false } }, // Fallback for older quizzes
                    { visibility: 'private', createdBy: req.user._id }
                ];
            }
        }
        const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('mcqIds', '-correctAnswer -explanation'); 
        // Hide correct answer and explanation from the quiz view for safety!
        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this quiz' });
        }

        await Quiz.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quiz removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
