import api from './axios.js'

export const instructorAPI = {
  dashboard:         ()     => api.get('/instructor/dashboard'),
  getCourses:        ()     => api.get('/instructor/courses'),
  getCourseAnalytics:(id)   => api.get(`/instructor/courses/${id}/analytics`),
  getAnalytics:      ()     => api.get('/instructor/analytics'),
  getUploadSignature:()     => api.post('/instructor/upload-signature'),
}
