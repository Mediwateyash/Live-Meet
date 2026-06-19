import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import MCQ from '../models/MCQ.js';

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

        console.log("[submitQuiz] Created result:", result);
        console.log("[submitQuiz] Sending resultId:", result ? result._id : 'undefined');

        res.status(201).json({
            message: 'Quiz submitted successfully',
            score: percentage,
            result: result,
            resultId: result._id
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
            .populate('studentId', 'name email')
            .populate({
                path: 'answers.mcqId',
                select: 'question options correctAnswer explanation'
            });

        if (!result) {
            console.log(`[getResultById] Result ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Result not found' });
        }

        const studentIdStr = result.studentId ? result.studentId._id.toString() : null;
        const reqUserIdStr = req.user._id.toString();

        if (studentIdStr !== reqUserIdStr && req.user.role !== 'teacher' && req.user.role !== 'admin' && req.user.role !== 'instructor') {
            console.log(`[getResultById] Not authorized. Result studentId: ${studentIdStr}, Requester: ${reqUserIdStr}, Role: ${req.user.role}`);
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(result);
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
            .populate('studentId', 'name email')
            .populate('quizId', 'title')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
