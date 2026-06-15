import api from './axios.js'

export const coursesAPI = {
  browse:     (params)    => api.get('/courses', { params }),
  featured:   ()          => api.get('/courses/featured'),
  getBySlug:  (slug)      => api.get(`/courses/${slug}`),
  create:     (data)      => api.post('/courses', data),
  update:     (id, data)  => api.put(`/courses/${id}`, data),
  delete:     (id)        => api.delete(`/courses/${id}`),
  enroll:     (id)        => api.post(`/courses/${id}/enroll`),
  getLearn:   (id)        => api.get(`/courses/${id}/learn`),
  addReview:  (id, data)  => api.post(`/courses/${id}/review`, data),
}
