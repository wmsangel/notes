// frontend/src/services/api/todos.js
import api from '@/config/api'

export const getAllLists = async () => {
    const response = await api.get('/todos/lists')
    return response.data
}

export const getListById = async (id) => {
    const response = await api.get(`/todos/lists/${id}`)
    return response.data
}

export const getListByFolder = async (folderId) => {
    const response = await api.get(`/todos/folder/${folderId}`)
    return response.data
}

export const createList = async (data) => {
    const response = await api.post('/todos/lists', data)
    return response.data
}

export const updateList = async (id, data) => {
    const response = await api.put(`/todos/lists/${id}`, data)
    return response.data
}

export const deleteList = async (id) => {
    const response = await api.delete(`/todos/lists/${id}`)
    return response.data
}

export const createItem = async (data) => {
    const response = await api.post('/todos/items', data)
    return response.data
}

export const updateItem = async (id, data) => {
    const response = await api.put(`/todos/items/${id}`, data)
    return response.data
}

export const toggleItem = async (id) => {
    const response = await api.patch(`/todos/items/${id}/toggle`)
    return response.data
}

export const deleteItem = async (id) => {
    const response = await api.delete(`/todos/items/${id}`)
    return response.data
}

export const reorderItems = async (list_id, order) => {
    const response = await api.post('/todos/items/reorder', { list_id, order })
    return response.data
}

export const getOverview = async (params = {}) => {
    const response = await api.get('/todos/overview', { params })
    return response.data
}

// Связи с заметками
export const linkNote = async (todoItemId, noteId) => {
    const response = await api.post('/todos/items/link-note', { todoItemId, noteId })
    return response.data
}

export const unlinkNote = async (todoItemId, noteId) => {
    const response = await api.post('/todos/items/unlink-note', { todoItemId, noteId })
    return response.data
}

export const getLinkedNotes = async (todoItemId) => {
    const response = await api.get(`/todos/items/${todoItemId}/notes`)
    return response.data
}

// Link note to list (single note)
export const linkNoteToList = async (listId, noteId) => {
    const response = await api.post(`/todos/lists/${listId}/link-note`, { noteId })
    return response.data
}
