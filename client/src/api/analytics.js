import api from './axios.js';

export const analyticsAPI = {
  getCourseStats: (courseId, dateRange = 'all') => api.get(`/analytics/course/${courseId}?dateRange=${dateRange}`),
  getCourseAIInsights: (courseId, forceRefresh = false, dateRange = 'all') => api.post(`/analytics/course/${courseId}/ai-insights?forceRefresh=${forceRefresh}&dateRange=${dateRange}`),
};
