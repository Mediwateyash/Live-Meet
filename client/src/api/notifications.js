import api from './axios.js'

export const notificationsAPI = {
  getAll:    (params)  => api.get('/notifications', { params }),
  markRead:  (id)      => api.patch(`/notifications/${id}/read`),
  markAllRead: ()      => api.patch('/notifications/read-all'),
  remove:    (id)      => api.delete(`/notifications/${id}`),
  clearAll:  ()        => api.delete('/notifications/clear-all'),
}
