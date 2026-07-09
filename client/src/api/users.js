import api from './axios.js'

export const usersAPI = {
  getProfile:          (id)      => api.get(`/users/${id}`),
  getEnrolled:         ()        => api.get('/users/me/enrolled'),
  getWishlist:         ()        => api.get('/users/me/wishlist'),
  updateProfile:       (data)    => api.put('/users/profile', data),
  becomeInstructor:    (data)    => api.post('/users/become-instructor', data),
  getRequestStatus:    ()        => api.get('/users/instructor-request/status'),
  toggleWishlist:      (courseId)=> api.put(`/users/wishlist/${courseId}`),
  updatePassword:      (passwords)=> api.put('/users/profile/password', passwords),
  deleteAccount:       ()        => api.delete('/users/profile'),
}

