// frontend/src/services/api/dashboard.js
import api from '@/config/api'

export const dashboardApi = {
    getWidgets() {
        return api.get('/dashboard/widgets')
    },

    getStats() {
        return api.get('/dashboard/stats')
    },

    createWidget(data) {
        return api.post('/dashboard/widgets', data)
    },

    updateWidget(id, data) {
        return api.put(`/dashboard/widgets/${id}`, data)
    },

    deleteWidget(id) {
        return api.delete(`/dashboard/widgets/${id}`)
    },

    getLinks() {
        return api.get('/dashboard/links')
    },

    createLink(data) {
        return api.post('/dashboard/links', data)
    },

    updateLink(id, data) {
        return api.put(`/dashboard/links/${id}`, data)
    },

    deleteLink(id) {
        return api.delete(`/dashboard/links/${id}`)
    }
}
