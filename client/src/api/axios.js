import axios from 'axios'
import useAuthStore from '../store/authStore.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve())
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthRoute = original.url?.includes('/auth/refresh') ||
                        original.url?.includes('/auth/login') ||
                        original.url?.includes('/auth/register') ||
                        original.url?.includes('/auth/forgot-password') ||
                        original.url?.includes('/auth/reset-password')

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(original)).catch(err => Promise.reject(err))
      }
      original._retry = true
      isRefreshing = true
      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(original)
      } catch (err) {
        processQueue(err)
        useAuthStore.getState().logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
