// frontend/src/services/api/export.js
import api from '@/config/api'

export const exportApi = {
    /** Что доступно из экспортов на этой машине (Apple Notes только на macOS-сервере). */
    getCapabilities() {
        return api.get('/export/capabilities')
    },

    /** Папки для выбора того, что экспортировать. */
    getFolders() {
        return api.get('/export/folders')
    },

    /**
     * Массовый экспорт в Apple Notes.
     * payload: {
     *   scope: 'all' | 'folder' | 'ids',
     *   folder_id?: number | null,
     *   ids?: number[],
     *   target_folder?: string,
     *   include_attachments?: boolean
     * }
     */
    exportToAppleNotes(payload) {
        return api.post('/export/apple-notes', payload, {
            // экспорт может идти долго — крутим заметки одна за одной
            timeout: 5 * 60 * 1000
        })
    }
}

export default exportApi
