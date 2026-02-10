// frontend/src/config/api.js
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor
api.interceptors.request.use(
    config => {
        const method = (config.method || 'get').toLowerCase()
        if (!['get', 'head', 'options'].includes(method)) {
            const csrf = document.cookie
                .split(';')
                .map(v => v.trim())
                .find(v => v.startsWith('notes_csrf='))
            if (csrf) {
                const token = decodeURIComponent(csrf.split('=')[1] || '')
                config.headers['X-CSRF-Token'] = token
            }
        }
        // Можно добавить токен авторизации
        // const token = localStorage.getItem('token')
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`
        // }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
