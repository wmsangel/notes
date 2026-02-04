// frontend/src/stores/notes.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notesApi } from '@/services/api/notes'

export const useNotesStore = defineStore('notes', () => {
    const notes = ref([])
    const currentNote = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const searchQuery = ref('')
    const searchResults = ref([])

    // Computed
    const favoriteNotes = computed(() => {
        return notes.value.filter(n => n.is_favorite)
    })

    const pinnedNotes = computed(() => {
        return notes.value.filter(n => n.is_pinned)
    })

    const recentNotes = computed(() => {
        return [...notes.value]
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 10)
    })

    // Actions
    async function fetchNotes(filters = {}) {
        loading.value = true
        error.value = null
        try {
            const response = await notesApi.getAll(filters)
            notes.value = response.data
        } catch (err) {
            error.value = err.message
            console.error('Error fetching notes:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchNoteById(id) {
        loading.value = true
        error.value = null
        try {
            const response = await notesApi.getById(id)
            currentNote.value = response.data
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    async function unlockNote(id, password) {
        try {
            const response = await notesApi.unlock(id, password)
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function createNote(data) {
        try {
            const response = await notesApi.create(data)
            notes.value.unshift(response.data)
            currentNote.value = response.data
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function updateNote(id, data) {
        try {
            const response = await notesApi.update(id, data)
            const index = notes.value.findIndex(n => n.id === id)
            if (index !== -1) {
                notes.value[index] = response.data
            }
            if (currentNote.value?.id === id) {
                currentNote.value = response.data
            }
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function deleteNote(id) {
        try {
            await notesApi.delete(id)
            notes.value = notes.value.filter(n => n.id !== id)
            if (currentNote.value?.id === id) {
                currentNote.value = null
            }
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function reorderNotes(order) {
        try {
            await notesApi.reorder(order)
            const byId = new Map(notes.value.map(n => [n.id, n]))
            notes.value = order.map(id => byId.get(id)).filter(Boolean)
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function toggleFavorite(id) {
        try {
            const response = await notesApi.toggleFavorite(id)
            const index = notes.value.findIndex(n => n.id === id)
            if (index !== -1) {
                notes.value[index] = response.data
            }
            if (currentNote.value?.id === id) {
                currentNote.value = response.data
            }
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function searchNotes(query) {
        searchQuery.value = query
        if (!query || query.trim() === '') {
            searchResults.value = []
            return
        }

        try {
            const response = await notesApi.search(query)
            searchResults.value = response.data
        } catch (err) {
            console.error('Error searching notes:', err)
            searchResults.value = []
        }
    }

    function clearSearch() {
        searchQuery.value = ''
        searchResults.value = []
    }

    function setCurrentNote(note) {
        currentNote.value = note
    }

    function clearCurrentNote() {
        currentNote.value = null
    }

    return {
        notes,
        currentNote,
        loading,
        error,
        searchQuery,
        searchResults,
        favoriteNotes,
        pinnedNotes,
        recentNotes,
        fetchNotes,
        fetchNoteById,
        unlockNote,
        createNote,
        updateNote,
        deleteNote,
        reorderNotes,
        toggleFavorite,
        searchNotes,
        clearSearch,
        setCurrentNote,
        clearCurrentNote
    }
})