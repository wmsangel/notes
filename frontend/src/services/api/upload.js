// frontend/src/services/api/upload.js
import api from '@/config/api'

export const uploadApi = {
    uploadImage(noteId, file) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('noteId', noteId)

        return api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    getImagesByNote(noteId) {
        return api.get(`/upload/note/${noteId}`)
    },

    deleteImage(id) {
        return api.delete(`/upload/${id}`)
    }
}