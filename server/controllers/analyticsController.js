import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Material from '../models/Material.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import LiveLecture from '../models/LiveLecture.js';
import VideoEngagement from '../models/VideoEngagement.js';

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

        // 1. Course Details & Total Enrollments
        const course = await Course.findById(courseId).select('title enrolledStudents');
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const enrolledStudentsStr = course.enrolledStudents.map(id => id.toString());
        const totalEnrollments = enrolledStudentsStr.length;

        // 2. Course Completion Rate & Learning Funnel
        const progressRecords = await Progress.find({ course: courseId, student: { $in: course.enrolledStudents } });
        
        let completedStudents = 0;
        let inProgressStudents = 0;
        let totalProgressPercent = 0;
        let reached50 = 0;
        let reached75 = 0;
        
        // Activity tracking (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentlyActiveLearners = 0;

        progressRecords.forEach(p => {
            if (p.isCompleted) {
                completedStudents++;
            } else if (p.percentComplete > 0) {
                inProgressStudents++;
            }
            totalProgressPercent += (p.percentComplete || 0);

            if (p.updatedAt >= thirtyDaysAgo) {
                recentlyActiveLearners++;
            }

            if (p.isCompleted || p.percentComplete >= 75) reached75++;
            if (p.isCompleted || p.percentComplete >= 50) reached50++;
        });

        const notStartedStudents = totalEnrollments - completedStudents - inProgressStudents;
        const completionRate = totalEnrollments > 0 ? (completedStudents / totalEnrollments) * 100 : 0;
        const averageProgressPercentage = totalEnrollments > 0 ? (totalProgressPercent / totalEnrollments) : 0;
        const recentActivityRate = totalEnrollments > 0 ? (recentlyActiveLearners / totalEnrollments) * 100 : 0;

        const started = inProgressStudents + completedStudents;
        reached50 = Math.min(started, Math.max(reached50, reached75, completedStudents));
        reached75 = Math.min(reached50, Math.max(reached75, completedStudents));

        const learningFunnel = {
            enrolled: totalEnrollments,
            started,
            reached50,
            reached75,
            completed: completedStudents
        };

        // 3. Assessment Average, Trend, and Performance Distribution
        const quizzes = await Quiz.find({ courseId }).select('_id mcqIds title');
        const quizIds = quizzes.map(q => q._id);
        const quizMap = {};
        quizzes.forEach(q => {
            quizMap[q._id.toString()] = { maxScore: q.mcqIds ? q.mcqIds.length : 0, title: q.title };
        });

        let assessmentAverage = 0;
        const assessmentTrend = [];
        const performanceDistribution = {
            excellent: 0,
            good: 0,
            average: 0,
            atRisk: 0,
            noAssessmentData: totalEnrollments
        };

        if (quizIds.length > 0) {
            const results = await Result.find({ quizId: { $in: quizIds }, studentId: { $in: course.enrolledStudents } }).sort('createdAt');
            
            if (results.length > 0) {
                let totalNormalizedScore = 0;
                let validResultsCount = 0;
                const studentScores = {};
                const quizTrendMap = {}; 

                results.forEach(r => {
                    const quizInfo = quizMap[r.quizId.toString()];
                    if (quizInfo && quizInfo.maxScore > 0) {
                        const normalized = (r.score / quizInfo.maxScore) * 100;
                        totalNormalizedScore += normalized;
                        validResultsCount++;

                        const studentIdStr = r.studentId.toString();
                        if (!studentScores[studentIdStr]) {
                            studentScores[studentIdStr] = { total: 0, count: 0 };
                        }
                        studentScores[studentIdStr].total += normalized;
                        studentScores[studentIdStr].count++;

                        const quizKey = r.quizId.toString();
                        if (!quizTrendMap[quizKey]) {
                            quizTrendMap[quizKey] = {
                                date: r.createdAt.toISOString().split('T')[0],
                                quizTitle: quizInfo.title,
                                totalScore: 0,
                                attempts: 0
                            };
                        }
                        quizTrendMap[quizKey].totalScore += normalized;
                        quizTrendMap[quizKey].attempts++;
                    }
                });

                if (validResultsCount > 0) {
                    assessmentAverage = totalNormalizedScore / validResultsCount;
                }

                let studentsWithData = 0;
                Object.values(studentScores).forEach(student => {
                    const avg = student.total / student.count;
                    if (avg >= 80) performanceDistribution.excellent++;
                    else if (avg >= 60) performanceDistribution.good++;
                    else if (avg >= 40) performanceDistribution.average++;
                    else performanceDistribution.atRisk++;
                    studentsWithData++;
                });
                performanceDistribution.noAssessmentData = Math.max(0, totalEnrollments - studentsWithData);

                Object.values(quizTrendMap).forEach(trend => {
                    assessmentTrend.push({
                        date: trend.date,
                        quizTitle: trend.quizTitle,
                        averageScore: trend.totalScore / trend.attempts,
                        attempts: trend.attempts
                    });
                });
                assessmentTrend.sort((a, b) => new Date(a.date) - new Date(b.date));
            }
        }

        // 4. Average Attendance and Attendance Trend
        const lectures = await LiveLecture.find({ courseId }).select('title scheduledAt attendance').sort('scheduledAt');
        const totalLectures = lectures.length;
        let averageAttendanceRate = 0;
        let totalAttendeeCount = 0;
        const attendanceTrend = [];

        if (totalLectures > 0 && totalEnrollments > 0) {
            let totalLectureRates = 0;

            lectures.forEach(lecture => {
                const uniqueAttendees = new Set();
                if (lecture.attendance) {
                    lecture.attendance.forEach(a => {
                        if (a.user && enrolledStudentsStr.includes(a.user.toString())) {
                            uniqueAttendees.add(a.user.toString());
                        }
                    });
                }
                const validAttendees = uniqueAttendees.size;
                totalAttendeeCount += validAttendees;
                const lectureRate = (validAttendees / totalEnrollments) * 100;
                totalLectureRates += lectureRate;

                attendanceTrend.push({
                    date: lecture.scheduledAt ? lecture.scheduledAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    lectureTitle: lecture.title,
                    attendanceRate: lectureRate,
                    attendeeCount: validAttendees
                });
            });

            averageAttendanceRate = totalLectureRates / totalLectures;
        }
        
        const averageAttendeeCount = totalLectures > 0 ? (totalAttendeeCount / totalLectures) : 0;

        // 6. Video Analytics
        const videoEngagements = await VideoEngagement.find({ courseId }).populate('lessonId', 'title');
        
        let totalWatchedSeconds = 0;
        let totalUniqueWatchedSeconds = 0;
        let totalVideoCompletion = 0;
        let completedVideoCount = 0;
        let totalVideoSessions = 0;
        const engagedLearnersSet = new Set();
        
        const lessonStats = {};

        videoEngagements.forEach(ve => {
            engagedLearnersSet.add(ve.studentId.toString());
            totalWatchedSeconds += ve.totalWatchedSeconds;
            totalUniqueWatchedSeconds += ve.uniqueWatchedSeconds;
            totalVideoCompletion += ve.completionPercentage || 0;
            if (ve.isCompleted) completedVideoCount++;
            totalVideoSessions += (ve.sessionCount || 1);

            const lid = ve.lessonId ? ve.lessonId._id.toString() : 'unknown';
            if (!lessonStats[lid]) {
                lessonStats[lid] = {
                    lessonTitle: ve.lessonId ? ve.lessonId.title : 'Deleted Lesson',
                    totalWatchTime: 0,
                    totalCompletion: 0,
                    completedCount: 0,
                    learners: new Set()
                };
            }
            lessonStats[lid].totalWatchTime += ve.totalWatchedSeconds;
            lessonStats[lid].totalCompletion += ve.completionPercentage || 0;
            if (ve.isCompleted) lessonStats[lid].completedCount++;
            lessonStats[lid].learners.add(ve.studentId.toString());
        });

        const engagedLearnerCount = engagedLearnersSet.size;
        
        const videoAnalytics = {
            averageWatchTime: engagedLearnerCount > 0 ? (totalWatchedSeconds / engagedLearnerCount) : 0,
            averageUniqueWatchTime: engagedLearnerCount > 0 ? (totalUniqueWatchedSeconds / engagedLearnerCount) : 0,
            averageVideoCompletion: videoEngagements.length > 0 ? (totalVideoCompletion / videoEngagements.length) : 0,
            videoCompletionRate: videoEngagements.length > 0 ? (completedVideoCount / videoEngagements.length) * 100 : 0,
            totalVideoSessions,
            engagedLearners: engagedLearnerCount
        };

        const lectureVideoPerformance = Object.keys(lessonStats).map(lid => {
            const stats = lessonStats[lid];
            const lCount = stats.learners.size;
            return {
                lessonId: lid,
                lessonTitle: stats.lessonTitle,
                averageWatchTime: lCount > 0 ? (stats.totalWatchTime / lCount) : 0,
                averageCompletionPercentage: lCount > 0 ? (stats.totalCompletion / lCount) : 0,
                completionRate: lCount > 0 ? (stats.completedCount / lCount) * 100 : 0,
                engagedLearners: lCount
            };
        });

        // 5. Course Health Score
        let healthScore = 0;
        let weights = { attendance: 30, progress: 30, assessment: 30, activity: 10 };
        
        let activeWeightsTotal = 0;
        const availableMetrics = {};
        
        if (totalLectures > 0) {
            availableMetrics.attendance = averageAttendanceRate;
            activeWeightsTotal += weights.attendance;
        } else {
            availableMetrics.attendance = null;
        }

        availableMetrics.progress = averageProgressPercentage;
        activeWeightsTotal += weights.progress;

        if (quizIds.length > 0) {
            availableMetrics.assessment = assessmentAverage;
            activeWeightsTotal += weights.assessment;
        } else {
            availableMetrics.assessment = null;
        }

        availableMetrics.activity = recentActivityRate;
        activeWeightsTotal += weights.activity;

        if (activeWeightsTotal > 0) {
            let tempScore = 0;
            if (availableMetrics.attendance !== null) {
                tempScore += availableMetrics.attendance * (weights.attendance / activeWeightsTotal);
            }
            tempScore += availableMetrics.progress * (weights.progress / activeWeightsTotal);
            if (availableMetrics.assessment !== null) {
                tempScore += availableMetrics.assessment * (weights.assessment / activeWeightsTotal);
            }
            tempScore += availableMetrics.activity * (weights.activity / activeWeightsTotal);
            
            healthScore = tempScore;
        }

        res.json({
            course: {
                id: course._id,
                title: course.title
            },
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
            metadata: {
                totalLectures,
                averageAttendeeCount
            }
        });
    } catch (error) {
        console.error('Course Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
};
