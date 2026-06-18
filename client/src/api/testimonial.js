import api from './axios.js'

export const testimonialAPI = {
  // Public
  getAll: () => api.get('/testimonials'),
  
  // Admin
  getAdminAll: () => api.get('/testimonials/admin'),
  create: (data) => api.post('/testimonials/admin', data),
  update: (id, data) => api.put(`/testimonials/admin/${id}`, data),
  delete: (id) => api.delete(`/testimonials/admin/${id}`)
}
