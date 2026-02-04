// frontend/src/services/api/folders.js
import api from '@/config/api'

export const foldersApi = {
    getAll() {
        return api.get('/folders')
    },

    getTree() {
        return api.get('/folders/tree')
    },

    getWithCount() {
        return api.get('/folders/with-count')
    },

    create(data) {
        return api.post('/folders', data)
    },

    update(id, data) {
        return api.put(`/folders/${id}`, data)
    },

    delete(id) {
        return api.delete(`/folders/${id}`)
    },

    reorder(id, position) {
        return api.put(`/folders/${id}/reorder`, { position })
    }
}