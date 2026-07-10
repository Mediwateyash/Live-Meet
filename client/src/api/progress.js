import api from './axios.js'

export const progressAPI = {
  get:              (courseId)                    => api.get(`/progress/${courseId}`),
  markLesson:       (courseId, lessonId)          => api.post(`/progress/${courseId}/lesson/${lessonId}`),
  savePosition:     (courseId, data)              => api.put(`/progress/${courseId}/position`, data),
  syncVideoProgress:(data)                        => api.put(`/progress/video-sync`, data),
}
