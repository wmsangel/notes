// frontend/src/stores/todos.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as todosApi from '@/services/api/todos'

export const useTodosStore = defineStore('todos', () => {
    const lists = ref([])
    const currentList = ref(null)

    const fetchLists = async () => {
        const data = await todosApi.getAllLists()
        lists.value = data
        return data
    }

    const fetchListById = async (id) => {
        const data = await todosApi.getListById(id)
        currentList.value = data
        return data
    }

    const fetchListByFolder = async (folderId) => {
        const data = await todosApi.getListByFolder(folderId)
        currentList.value = data
        return data
    }

    const createList = async (listData) => {
        const newList = await todosApi.createList(listData)
        lists.value.unshift(newList)
        return newList
    }

    const updateList = async (id, listData) => {
        const updated = await todosApi.updateList(id, listData)
        const index = lists.value.findIndex(l => l.id === id)
        if (index !== -1) {
            lists.value[index] = updated
        }
        return updated
    }

    const deleteList = async (id) => {
        await todosApi.deleteList(id)
        lists.value = lists.value.filter(l => l.id !== id)
    }

    const createItem = async (itemData) => {
        return await todosApi.createItem(itemData)
    }

    const updateItem = async (id, itemData) => {
        return await todosApi.updateItem(id, itemData)
    }

    const toggleItem = async (id) => {
        return await todosApi.toggleItem(id)
    }

    const deleteItem = async (id) => {
        await todosApi.deleteItem(id)
    }

    const reorderItems = async (listId, order) => {
        return await todosApi.reorderItems(listId, order)
    }

    // Связи с заметками
    const linkNoteToItem = async (todoItemId, noteId) => {
        return await todosApi.linkNote(todoItemId, noteId)
    }

    const unlinkNoteFromItem = async (todoItemId, noteId) => {
        return await todosApi.unlinkNote(todoItemId, noteId)
    }

    const getLinkedNotes = async (todoItemId) => {
        return await todosApi.getLinkedNotes(todoItemId)
    }

    const linkNoteToList = async (listId, noteId) => {
        return await todosApi.linkNoteToList(listId, noteId)
    }

    return {
        lists,
        currentList,
        fetchLists,
        fetchListById,
        fetchListByFolder,
        createList,
        updateList,
        deleteList,
        createItem,
        updateItem,
        toggleItem,
        deleteItem,
        reorderItems,
        linkNoteToItem,
        unlinkNoteFromItem,
        getLinkedNotes,
        linkNoteToList
    }
})
