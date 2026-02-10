// frontend/src/stores/dashboard.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/services/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
    const widgets = ref([])
    const stats = ref({
        notes: { total: 0, recent: [] },
        folders: { total: 0 },
        todos: { total: 0, completed: 0, pending: 0 },
        favorites: [],
        pinned: [],
        tags: []
    })
    const loading = ref(false)
    const error = ref(null)
    const lastFetchedAt = ref(0)

    // Actions
    async function fetchWidgets() {
        loading.value = true
        error.value = null
        try {
            const response = await dashboardApi.getWidgets()
            widgets.value = response.data
        } catch (err) {
            error.value = err.message
            console.error('Error fetching widgets:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchStats(force = false) {
        if (!force && Date.now() - lastFetchedAt.value < 15000) return stats.value
        try {
            const response = await dashboardApi.getStats()
            stats.value = response.data
            lastFetchedAt.value = Date.now()
            return stats.value
        } catch (err) {
            console.error('Error fetching stats:', err)
        }
    }

    async function createWidget(data) {
        try {
            const response = await dashboardApi.createWidget(data)
            widgets.value.push(response.data)
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function updateWidget(id, data) {
        try {
            const response = await dashboardApi.updateWidget(id, data)
            const index = widgets.value.findIndex(w => w.id === id)
            if (index !== -1) {
                widgets.value[index] = response.data
            }
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function deleteWidget(id) {
        try {
            await dashboardApi.deleteWidget(id)
            widgets.value = widgets.value.filter(w => w.id !== id)
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function toggleWidgetVisibility(id) {
        const widget = widgets.value.find(w => w.id === id)
        if (widget) {
            await updateWidget(id, { is_visible: !widget.is_visible })
        }
    }

    return {
        widgets,
        stats,
        loading,
        error,
        fetchWidgets,
        fetchStats,
        createWidget,
        updateWidget,
        deleteWidget,
        toggleWidgetVisibility
    }
})
