import api from './axios.js'

export const supportAPI = {
  submitTicket: (data) => api.post('/support', data),
  getMyTickets: () => api.get('/support/my-tickets'),
  adminGetAllTickets: () => api.get('/support/admin/all'),
  adminReplyTicket: (id, reply) => api.post(`/support/admin/${id}/reply`, { reply }),
}
