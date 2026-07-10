import api from './axios.js';

export const analyticsAPI = {
    getCourseStats: (courseId) => api.get(`/analytics/course/${courseId}`)
};
