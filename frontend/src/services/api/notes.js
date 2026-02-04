// frontend/src/services/api/notes.js
import api from '@/config/api'

export const notesApi = {
    getAll(params = {}) {
        return api.get('/notes', { params })
    },

    getById(id) {
        return api.get(`/notes/${id}`)
    },

    unlock(id, password) {
        return api.post(`/notes/${id}/unlock`, { password })
    },

    create(data) {
        return api.post('/notes', data)
    },

    update(id, data) {
        return api.put(`/notes/${id}`, data)
    },

    delete(id) {
        return api.delete(`/notes/${id}`)
    },

    toggleFavorite(id) {
        return api.patch(`/notes/${id}/favorite`)
    },

    search(query) {
        return api.get('/notes/search', { params: { q: query } })
    },

    reorder(order) {
        return api.post('/notes/reorder', { order })
    }
}