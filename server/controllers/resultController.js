import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import MCQ from '../models/MCQ.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

export const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers = [] } = req.body; 
        // answers = [{ mcqId, selected }]

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let score = 0;
        const evaluatedAnswers = [];

        for (const answer of answers) {
            if (!answer || !answer.mcqId) continue;
            const mcq = await MCQ.findById(answer.mcqId);
            const isCorrect = mcq && mcq.correctAnswer === answer.selected;
            if (isCorrect) score++;

            evaluatedAnswers.push({
                mcqId: answer.mcqId,
                selected: answer.selected
            });
        }

        const totalQuestions = quiz.mcqIds?.length || 0;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

        const result = await Result.create({
            studentId: req.user._id,
            quizId,
            score: percentage,
            answers: evaluatedAnswers
        });

        // Check if student has given all exams for this course
        const course = await Course.findById(quiz.courseId);
        let passedFinalExam = false;
        
        if (course) {
            // Find all public quizzes for this course
            const courseQuizzes = await Quiz.find({ courseId: course._id, visibility: { $ne: 'private' } });
            
            // Find all results for this student
            const studentResults = await Result.find({ studentId: req.user._id });
            const attemptedQuizIds = studentResults.map(r => r.quizId.toString());
            
            // Check if every course quiz has been attempted
            const hasGivenAll = courseQuizzes.length > 0 && courseQuizzes.every(q => attemptedQuizIds.includes(q._id.toString()));
            
            if (hasGivenAll) {
                passedFinalExam = true;
                await Progress.findOneAndUpdate(
                    { student: req.user._id, course: course._id },
                    { hasPassedFinalExam: true },
                    { new: true, upsert: true }
                );
            }
        }


        res.status(201).json({
            message: 'Quiz submitted successfully',
            score: percentage,
            result: result,
            resultId: result._id,
            passedFinalExam
        });
    } catch (error) {
        console.error("[submitQuiz] Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getMyResults = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.user._id }).populate('quizId', 'title timer');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getResultById = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('quizId', 'title')
            .populate('studentId', 'fullName name email')
            .populate({
                path: 'answers.mcqId',
                select: 'question options correctAnswer explanation'
            });

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        const studentIdStr = result.studentId ? result.studentId._id.toString() : null;
        const reqUserIdStr = req.user._id.toString();

        if (studentIdStr !== reqUserIdStr && req.user.role !== 'admin') {
            if (req.user.role === 'instructor') {
                const quiz = await Quiz.findById(result.quizId?._id || result.quizId);
                if (!quiz || quiz.createdBy.toString() !== reqUserIdStr) {
                    return res.status(403).json({ message: 'Not authorized' });
                }
            } else {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const resultObj = result.toObject();
        // Allow students to see the correct answers in their detailed review
        
        res.json(resultObj);
    } catch (error) {
        console.error(`[getResultById] Error:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const getTeacherResults = async (req, res) => {
    try {
        // Find all quizzes created by this teacher
        const quizzes = await Quiz.find({ createdBy: req.user._id }).select('_id');
        const quizIds = quizzes.map(q => q._id);

        // Find all results for these quizzes
        const results = await Result.find({ quizId: { $in: quizIds } })
            .populate('studentId', 'fullName name email')
            .populate('quizId', 'title')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
