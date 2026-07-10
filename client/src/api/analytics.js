import api from './axios.js';

export const analyticsAPI = {
export const analyticsAPI = {
  getCourseStats: (courseId) => api.get(`/analytics/course/${courseId}`),
  getCourseAIInsights: (courseId, forceRefresh = false) => api.post(`/analytics/course/${courseId}/ai-insights?forceRefresh=${forceRefresh}`),
};
