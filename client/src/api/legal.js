import api from './axios.js'

export const legalAPI = {
  getAll: () => api.get('/legal'),
  getOne: (key) => api.get(`/legal/${key}`),
  toggle: (key) => api.patch(`/legal/${key}/toggle`),
}
