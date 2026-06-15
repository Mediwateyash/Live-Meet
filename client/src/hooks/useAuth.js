import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore.js'
import { authAPI } from '../api/auth.js'

export function useAuth() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const fetchMe = async () => {
    setLoading(true)
    try {
      const { data } = await authAPI.me()
      setUser(data.data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  return { user, isAuthenticated, loading, fetchMe, logout }
}
