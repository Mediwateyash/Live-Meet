export const generateDeterministicCourseInsights = (analyticsSummary) => {
  const insights = [];
  const recommendations = [];

  const { kpis, attendanceSummary, assessmentSummary, videoSummary, performanceDistribution } = analyticsSummary;

  // 1. Progress & Enrollment
  if (kpis.averageProgressPercentage < 20) {
    insights.push({
      type: 'warning',
      category: 'progress',
      title: 'Low Overall Progress',
      message: `The average course progress is only ${kpis.averageProgressPercentage.toFixed(1)}%.`,
      priority: 'high'
    });
    recommendations.push({
      title: 'Send Progress Reminder',
      reason: 'Many students are lagging behind. A nudge might help re-engage them.',
      priority: 'high',
      category: 'progress'
    });
  } else {
    insights.push({
      type: 'positive',
      category: 'progress',
      title: 'Healthy Progress',
      message: `Learners are progressing well with an average completion of ${kpis.averageProgressPercentage.toFixed(1)}%.`,
      priority: 'low'
    });
  }

  // 2. Attendance
  if (kpis.averageAttendanceRate < 50) {
    insights.push({
      type: 'warning',
      category: 'attendance',
      title: 'Low Attendance',
      message: `Average attendance is below 50% (${kpis.averageAttendanceRate.toFixed(1)}%).`,
      priority: 'high'
    });
  }

  // 3. Performance
  if (performanceDistribution.atRisk > 0) {
    insights.push({
      type: 'warning',
      category: 'assessment',
      title: 'Students At Risk',
      message: `${performanceDistribution.atRisk} students are categorized as 'At Risk' based on assessment scores.`,
      priority: 'high'
    });
    recommendations.push({
      title: 'Identify At-Risk Students',
      reason: 'Offer additional support or revision materials to struggling learners.',
      priority: 'high',
      category: 'assessment'
    });
  }

  // 4. Video Engagement
  if (videoSummary.averageVideoCompletion < 40 && videoSummary.engagedLearners > 0) {
    insights.push({
      type: 'information',
      category: 'video',
      title: 'Low Video Completion',
      message: `Learners who start videos only complete ${videoSummary.averageVideoCompletion.toFixed(1)}% on average.`,
      priority: 'medium'
    });
    recommendations.push({
      title: 'Review Video Length',
      reason: 'Low video completion rates may indicate videos are too long or lose learner interest.',
      priority: 'medium',
      category: 'video'
    });
  }

  return {
    summary: `Course Health Score is ${kpis.courseHealthScore.toFixed(1)}/100. The course is currently ${kpis.courseHealthScore >= 70 ? 'performing well' : 'needing attention in key areas'}.`,
    insights: insights.slice(0, 5),
    recommendations: recommendations.slice(0, 5)
  };
};
