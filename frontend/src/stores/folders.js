// frontend/src/stores/folders.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { foldersApi } from '@/services/api/folders'

export const useFoldersStore = defineStore('folders', () => {
    const folders = ref([])
    const folderTree = ref([])
    const loading = ref(false)
    const error = ref(null)
    const selectedFolderId = ref(null)

    // Computed
    const selectedFolder = computed(() => {
        return folders.value.find(f => f.id === selectedFolderId.value) || null
    })

    const rootFolders = computed(() => {
        return folders.value.filter(f => f.parent_id === null)
    })

    /** Плоский список папок из дерева (для селектов, когда tree уже загружен) */
    function flattenTree(tree, result = []) {
        if (!Array.isArray(tree)) return result
        for (const node of tree) {
            result.push({ id: node.id, name: node.name, parent_id: node.parent_id })
            if (node.children?.length) flattenTree(node.children, result)
        }
        return result
    }
    const flatFolders = computed(() => flattenTree(folderTree.value))

    // Actions
    async function fetchFolders() {
        loading.value = true
        error.value = null
        try {
            const response = await foldersApi.getAll()
            folders.value = response.data
        } catch (err) {
            error.value = err.message
            console.error('Error fetching folders:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchFolderTree() {
        try {
            const response = await foldersApi.getTree()
            folderTree.value = response.data
        } catch (err) {
            console.error('Error fetching folder tree:', err)
        }
    }

    async function createFolder(data) {
        try {
            const response = await foldersApi.create(data)
            folders.value.push(response.data)
            await fetchFolderTree()
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function updateFolder(id, data) {
        try {
            const response = await foldersApi.update(id, data)
            const index = folders.value.findIndex(f => f.id === id)
            if (index !== -1) {
                folders.value[index] = response.data
            }
            await fetchFolderTree()
            return response.data
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    async function deleteFolder(id) {
        try {
            await foldersApi.delete(id)
            folders.value = folders.value.filter(f => f.id !== id)
            await fetchFolderTree()
            if (selectedFolderId.value === id) {
                selectedFolderId.value = null
            }
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    function selectFolder(id) {
        selectedFolderId.value = id
    }

    function clearSelection() {
        selectedFolderId.value = null
    }

    // Helper function to get folder path
    function getFolderPath(folderId) {
        const path = []
        let currentFolder = folders.value.find(f => f.id === folderId)

        while (currentFolder) {
            path.unshift(currentFolder)
            currentFolder = folders.value.find(f => f.id === currentFolder.parent_id)
        }

        return path
    }

    return {
        folders,
        folderTree,
        flatFolders,
        loading,
        error,
        selectedFolderId,
        selectedFolder,
        rootFolders,
        fetchFolders,
        fetchFolderTree,
        createFolder,
        updateFolder,
        deleteFolder,
        selectFolder,
        clearSelection,
        getFolderPath
    }
})