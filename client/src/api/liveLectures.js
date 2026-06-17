import api from './axios.js'

export const liveLecturesAPI = {
  // Instructor: get own lectures (optionally ?courseId=)
  getMine:       (params)     => api.get('/live-lectures', { params }),
  // Single lecture by ID (any authenticated user)
  getById:       (id)         => api.get(`/live-lectures/${id}`),
  create:        (data)       => api.post('/live-lectures', data),
  update:        (id, data)   => api.put(`/live-lectures/${id}`, data),
  remove:        (id)         => api.delete(`/live-lectures/${id}`),

  // Student: lectures for an enrolled course
  getForCourse:  (courseId)   => api.get('/live-lectures/enrolled', { params: courseId ? { courseId } : {} }),
  attend:        (id)         => api.post(`/live-lectures/${id}/attend`),

  // Admin: all lectures
  adminGetAll:   (params)     => api.get('/live-lectures/admin/all', { params }),
}
