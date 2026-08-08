import api from './axios.js'

export const paymentAPI = {
  createOrder: (courseId) => api.post('/payment/create-order', { courseId }),
  verifyPayment: (data) => api.post('/payment/verify-payment', data),
}
