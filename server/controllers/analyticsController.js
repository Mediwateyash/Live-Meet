import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Material from '../models/Material.js';

export const getTeacherAnalytics = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ createdBy: req.user._id });
        const quizIds = quizzes.map(q => q._id);

        const results = await Result.find({ quizId: { $in: quizIds } });

        const totalQuizzes = quizzes.length;
        const totalAttempts = results.length;
        const averageScore = results.length > 0 
            ? (results.reduce((acc, curr) => acc + curr.score, 0) / results.length).toFixed(2)
            : 0;

        res.json({
            totalQuizzes,
            totalAttempts,
            averageScore,
            recentResults: results.slice('-5').reverse() // Last 5 results
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentAnalytics = async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.user._id }).populate('quizId', 'title');

        const totalAttempts = results.length;
        const averageScore = results.length > 0 
            ? (results.reduce((acc, curr) => acc + curr.score, 0) / results.length).toFixed(2)
            : 0;

        // Data for a chart: scores over time
        const scoresHistory = results.map(r => ({
            quizTitle: r.quizId ? r.quizId.title : 'Deleted Quiz',
            score: r.score,
            date: r.createdAt
        }));

        res.json({
            totalAttempts,
            averageScore,
            scoresHistory
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
