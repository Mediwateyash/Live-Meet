import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Material from '../models/Material.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import LiveLecture from '../models/LiveLecture.js';
import VideoEngagement from '../models/VideoEngagement.js';
import CourseInsightCache from '../models/CourseInsightCache.js';
import { generateCourseInsights } from '../services/aiService.js';
import { generateDeterministicCourseInsights } from '../services/analyticsFallbackService.js';

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
            recentResults: results.slice(-5).reverse() // Last 5 results
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

export const getCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { dateRange } = req.query;
        const data = await calculateCourseAnalytics(courseId, dateRange);
        res.json(data);
    } catch (error) {
        console.error('Course Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const calculateCourseAnalytics = async (courseId, dateRange = 'all') => {
    let startDate = null;
    const now = new Date();
    if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    // If dateRange === 'all', startDate remains null

    // 1. Course Details & Total Enrollments
    const course = await Course.findById(courseId).select('title enrolledStudents').lean();
    if (!course) {
        throw new Error('Course not found');
    }
    const enrolledStudentsSet = new Set(course.enrolledStudents.map(id => String(id)));
    const totalEnrollments = enrolledStudentsSet.size;

    // 2. Fetch all required data in parallel
    const [progressRecords, quizzes, allLectures, videoEngagements] = await Promise.all([
        Progress.find({ course: courseId }).lean(),
        Quiz.find({ courseId }).select('_id mcqIds title').lean(),
        LiveLecture.find({ courseId }).select('title scheduledAt attendance').sort('scheduledAt').lean(),
        VideoEngagement.find({ courseId }).populate('lessonId', 'title').lean()
    ]);

    // Apply Date Filters where Semantically Correct
    
    // A. Attendance: Filter by scheduledAt
    const lectures = startDate 
        ? allLectures.filter(l => new Date(l.scheduledAt) >= startDate)
        : allLectures;

    // B. Assessment Results: Filter by Result.createdAt
    const quizIds = quizzes.map(q => q._id);
    const quizMap = new Map();
    quizzes.forEach(q => quizMap.set(String(q._id), { maxScore: q.mcqIds ? q.mcqIds.length : 0, title: q.title }));
    
    let resultQuery = { quizId: { $in: quizIds } };
    if (startDate) resultQuery.createdAt = { $gte: startDate };
    const results = await Result.find(resultQuery).sort('createdAt').lean();

    // 3. Course Completion Rate & Learning Funnel (ALL-TIME for structural consistency)
    let completedStudents = 0;
    let inProgressStudents = 0;
    let totalProgressPercent = 0;
    let reached50 = 0;
    let reached75 = 0;
    let recentlyActiveLearners = 0;

    progressRecords.forEach(p => {
        if (!enrolledStudentsSet.has(String(p.student))) return;

        if (p.isCompleted) completedStudents++;
        else if (p.percentComplete > 0) inProgressStudents++;
        
        totalProgressPercent += (p.percentComplete || 0);

        // Funnel is strictly sequential
        if (p.isCompleted || p.percentComplete >= 75) reached75++;
        if (p.isCompleted || p.percentComplete >= 50) reached50++;

        // Recently Active Learner uses Date Filter on Progress.updatedAt
        const updatedDate = new Date(p.updatedAt);
        if (startDate) {
            if (updatedDate >= startDate) recentlyActiveLearners++;
        } else {
            // If "all time", any progress counts as active
            recentlyActiveLearners++;
        }
    });

    const notStartedStudents = totalEnrollments - completedStudents - inProgressStudents;
    const completionRate = totalEnrollments > 0 ? (completedStudents / totalEnrollments) * 100 : 0;
    const averageProgressPercentage = totalEnrollments > 0 ? (totalProgressPercent / totalEnrollments) : 0;
    const recentActivityRate = totalEnrollments > 0 ? (recentlyActiveLearners / totalEnrollments) * 100 : 0;
    const started = inProgressStudents + completedStudents;

    const learningFunnel = { enrolled: totalEnrollments, started, reached50, reached75, completed: completedStudents };

    // 4. Assessment Average, Trend, and Performance Distribution
    let assessmentAverage = null;
    const assessmentTrend = [];
    const performanceDistribution = {
        excellent: 0, good: 0, average: 0, atRisk: 0, noAssessmentData: totalEnrollments
    };

    if (results.length > 0) {
        let totalNormalizedScore = 0;
        let validResultsCount = 0;
        const studentScores = new Map();
        const quizTrendMap = new Map(); 

        results.forEach(r => {
            const studentIdStr = String(r.studentId);
            if (!enrolledStudentsSet.has(studentIdStr)) return;

            const quizInfo = quizMap.get(String(r.quizId));
            if (quizInfo) {
                const normalized = r.score; // Result.score is already a percentage (0-100)
                totalNormalizedScore += normalized;
                validResultsCount++;

                if (!studentScores.has(studentIdStr)) studentScores.set(studentIdStr, { total: 0, count: 0 });
                const studentStat = studentScores.get(studentIdStr);
                studentStat.total += normalized;
                studentStat.count++;

                const quizKey = String(r.quizId);
                if (!quizTrendMap.has(quizKey)) {
                    quizTrendMap.set(quizKey, {
                        date: new Date(r.createdAt).toISOString().split('T')[0],
                        quizTitle: quizInfo.title,
                        totalScore: 0, attempts: 0
                    });
                }
                const trendStat = quizTrendMap.get(quizKey);
                trendStat.totalScore += normalized;
                trendStat.attempts++;
            }
        });

        if (validResultsCount > 0) assessmentAverage = totalNormalizedScore / validResultsCount;

        let studentsWithData = 0;
        for (const student of studentScores.values()) {
            const avg = student.total / student.count;
            if (avg >= 80) performanceDistribution.excellent++;
            else if (avg >= 60) performanceDistribution.good++;
            else if (avg >= 40) performanceDistribution.average++;
            else performanceDistribution.atRisk++;
            studentsWithData++;
        }
        performanceDistribution.noAssessmentData = totalEnrollments - studentsWithData;

        for (const trend of quizTrendMap.values()) {
            assessmentTrend.push({
                date: trend.date,
                quizTitle: trend.quizTitle,
                averageScore: trend.totalScore / trend.attempts,
                attempts: trend.attempts
            });
        }
        assessmentTrend.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 5. Average Attendance and Attendance Trend
    const totalLectures = lectures.length;
    let averageAttendanceRate = null;
    let totalAttendeeCount = 0;
    const attendanceTrend = [];

    if (totalLectures > 0) {
        let totalLectureRates = 0;
        
        if (totalEnrollments === 0) {
            averageAttendanceRate = 0;
        } else {

        lectures.forEach(lecture => {
            const uniqueAttendees = new Set();
            if (lecture.attendance) {
                lecture.attendance.forEach(a => {
                    if (a.user && enrolledStudentsSet.has(String(a.user))) {
                        uniqueAttendees.add(String(a.user));
                    }
                });
            }
            const validAttendees = uniqueAttendees.size;
            totalAttendeeCount += validAttendees;
            const lectureRate = (validAttendees / totalEnrollments) * 100;
            totalLectureRates += lectureRate;

            attendanceTrend.push({
                date: lecture.scheduledAt ? new Date(lecture.scheduledAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                lectureTitle: lecture.title,
                attendanceRate: lectureRate,
                attendeeCount: validAttendees
            });
        });
        averageAttendanceRate = totalLectureRates / totalLectures;
        }
    }
    const averageAttendeeCount = totalLectures > 0 ? (totalAttendeeCount / totalLectures) : 0;

    // 6. Video Analytics (ALL-TIME)
    let totalWatchedSeconds = 0;
    let totalUniqueWatchedSeconds = 0;
    let totalVideoCompletion = 0;
    let completedVideoCount = 0;
    let totalVideoSessions = 0;
    const engagedLearnersSet = new Set();
    const lessonStats = new Map();

    videoEngagements.forEach(ve => {
        const studentIdStr = String(ve.studentId);
        if (!enrolledStudentsSet.has(studentIdStr)) return;

        engagedLearnersSet.add(studentIdStr);
        totalWatchedSeconds += ve.totalWatchedSeconds || 0;
        totalUniqueWatchedSeconds += ve.uniqueWatchedSeconds || 0;
        totalVideoCompletion += ve.completionPercentage || 0;
        if (ve.isCompleted) completedVideoCount++;
        totalVideoSessions += (ve.sessionCount || 1);

        const lid = ve.lessonId ? String(ve.lessonId._id) : 'unknown';
        if (!lessonStats.has(lid)) {
            lessonStats.set(lid, {
                lessonTitle: ve.lessonId ? ve.lessonId.title : 'Deleted Lesson',
                totalWatchTime: 0, totalCompletion: 0, completedCount: 0, learners: new Set()
            });
        }
        const stat = lessonStats.get(lid);
        stat.totalWatchTime += ve.totalWatchedSeconds || 0;
        stat.totalCompletion += ve.completionPercentage || 0;
        if (ve.isCompleted) stat.completedCount++;
        stat.learners.add(studentIdStr);
    });

    const engagedLearnerCount = engagedLearnersSet.size;
    const validVideoEngagementCount = videoEngagements.filter(ve => enrolledStudentsSet.has(String(ve.studentId))).length;
    
    const videoAnalytics = {
        averageWatchTime: validVideoEngagementCount > 0 ? (engagedLearnerCount > 0 ? (totalWatchedSeconds / engagedLearnerCount) : 0) : null,
        averageUniqueWatchTime: validVideoEngagementCount > 0 ? (engagedLearnerCount > 0 ? (totalUniqueWatchedSeconds / engagedLearnerCount) : 0) : null,
        averageVideoCompletion: validVideoEngagementCount > 0 ? (totalVideoCompletion / validVideoEngagementCount) : 0,
        videoCompletionRate: validVideoEngagementCount > 0 ? (completedVideoCount / validVideoEngagementCount) * 100 : 0,
        totalVideoSessions,
        engagedLearners: engagedLearnerCount
    };

    const lectureVideoPerformance = [];
    for (const [lid, stats] of lessonStats.entries()) {
        const lCount = stats.learners.size;
        lectureVideoPerformance.push({
            lessonId: lid,
            lessonTitle: stats.lessonTitle,
            averageWatchTime: lCount > 0 ? (stats.totalWatchTime / lCount) : 0,
            averageCompletionPercentage: lCount > 0 ? (stats.totalCompletion / lCount) : 0,
            completionRate: lCount > 0 ? (stats.completedCount / lCount) * 100 : 0,
            engagedLearners: lCount
        });
    }

    // 7. Course Health Score (Invariant under Date Range to preserve macro view)
    let healthScore = 0;
    const weights = { attendance: 30, progress: 30, assessment: 30, activity: 10 };
    let activeWeightsTotal = 0;
    const availableMetrics = {};
    
    if (totalLectures > 0) { availableMetrics.attendance = averageAttendanceRate || 0; activeWeightsTotal += weights.attendance; }
    else { availableMetrics.attendance = null; }

    availableMetrics.progress = averageProgressPercentage;
    activeWeightsTotal += weights.progress;

    if (assessmentAverage !== null) { availableMetrics.assessment = assessmentAverage || 0; activeWeightsTotal += weights.assessment; }
    else { availableMetrics.assessment = null; }

    availableMetrics.activity = recentActivityRate;
    activeWeightsTotal += weights.activity;

    if (activeWeightsTotal > 0) {
        let tempScore = 0;
        if (availableMetrics.attendance !== null) tempScore += availableMetrics.attendance * (weights.attendance / activeWeightsTotal);
        tempScore += availableMetrics.progress * (weights.progress / activeWeightsTotal);
        if (availableMetrics.assessment !== null) tempScore += availableMetrics.assessment * (weights.assessment / activeWeightsTotal);
        tempScore += availableMetrics.activity * (weights.activity / activeWeightsTotal);
        healthScore = tempScore;
    }

    return {
        course: { id: course._id, title: course.title },
        kpis: {
            totalEnrollments,
            recentlyActiveLearners,
            averageWatchTime: videoAnalytics.averageWatchTime,
            averageAttendanceRate,
            averageProgressPercentage,
            completionRate,
            assessmentAverage,
            courseHealthScore: healthScore
        },
        progressDistribution: {
            completed: completedStudents,
            inProgress: inProgressStudents,
            notStarted: notStartedStudents
        },
        learningFunnel,
        attendanceTrend,
        assessmentTrend,
        performanceDistribution,
        videoAnalytics,
        lectureVideoPerformance,
        healthComponents: availableMetrics,
        metadata: { totalLectures, averageAttendeeCount }
    };
};

export const getCourseAIInsights = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { forceRefresh, dateRange = 'all' } = req.query;

        // Generate deterministic contextHash based on normalized filters
        const analyticsVersion = 'v2';
        const contextPayload = { courseId, dateRange, analyticsVersion };
        const contextHash = Buffer.from(JSON.stringify(contextPayload)).toString('base64');

        if (forceRefresh !== 'true') {
            const cached = await CourseInsightCache.findOne({ courseId, contextHash });
            if (cached) {
                return res.json({
                    source: 'ai',
                    cached: true,
                    generatedAt: cached.generatedAt,
                    ...cached.insightsData
                });
            }
        }

        const analyticsData = await calculateCourseAnalytics(courseId, dateRange);

        const sanitizedSummary = {
            contextScope: `Date Filter: ${dateRange}. Note: Video watch-time and Course Funnel metrics are ALWAYS evaluated as ALL-TIME cumulative metrics, regardless of dateRange.`,
            courseTitle: analyticsData.course.title,
            kpis: analyticsData.kpis,
            progressDistribution: analyticsData.progressDistribution,
            learningFunnel: analyticsData.learningFunnel,
            videoSummary: analyticsData.videoAnalytics,
            performanceDistribution: analyticsData.performanceDistribution
        };

        try {
            const aiResult = await generateCourseInsights(sanitizedSummary);
            
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 6);

            await CourseInsightCache.findOneAndUpdate(
                { courseId, contextHash },
                { 
                    insightsData: aiResult,
                    generatedAt: new Date(),
                    expiresAt
                },
                { upsert: true, new: true }
            );

            return res.json({
                source: 'ai',
                cached: false,
                generatedAt: new Date(),
                ...aiResult
            });
        } catch (aiError) {
            console.error('AI Insight Generation Failed, using fallback:', aiError.message);
            const fallbackResult = generateDeterministicCourseInsights(sanitizedSummary);
            
            return res.json({
                source: 'fallback',
                cached: false,
                generatedAt: new Date(),
                ...fallbackResult
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
