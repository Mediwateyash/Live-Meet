import api from './axios.js'

export const adminAPI = {
  dashboard:               ()           => api.get('/admin/dashboard'),
  getRequests:             (params)     => api.get('/admin/instructor-requests', { params }),
  approveRequest:          (id)         => api.put(`/admin/instructor-requests/${id}/approve`),
  rejectRequest:           (id, data)   => api.put(`/admin/instructor-requests/${id}/reject`, data),
  getUsers:                (params)     => api.get('/admin/users', { params }),
  updateUserRole:          (id, data)   => api.put(`/admin/users/${id}/role`, data),
  updateUserStatus:        (id, data)   => api.put(`/admin/users/${id}/status`, data),
  deleteUser:              (id)         => api.delete(`/admin/users/${id}`),
  getCourses:              (params)     => api.get('/admin/courses', { params }),
  updateCourseApproval:    (id, data)   => api.put(`/admin/courses/${id}/approve`, data),
  updateAnyCourse:         (id, data)   => api.put(`/admin/courses/${id}/edit`, data),
  deleteCourse:            (id)         => api.delete(`/admin/courses/${id}`),
  getInstructors:          ()           => api.get('/admin/instructors'),
  getInstructor:           (id)         => api.get(`/admin/instructors/${id}`),
  getInstructorCourses:    (id)         => api.get(`/admin/instructors/${id}/courses`),
  createCourseForInstructor: (id, data) => api.post(`/admin/instructors/${id}/courses`, data),
}
