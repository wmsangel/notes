// frontend/src/services/api/auth.js
import api from '@/config/api'

export const authApi = {
  status() {
    return api.get('/auth/status')
  },
  me() {
    return api.get('/auth/me')
  },
  login(password) {
    return api.post('/auth/login', { password })
  },
  logout() {
    return api.post('/auth/logout')
  }
}
