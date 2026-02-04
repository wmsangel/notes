// backend/routes/notes.js
import express from 'express'
import { noteController } from '../controllers/noteController.js'  // <-- Изменили на noteController

const router = express.Router()

// Получить все заметки (с фильтрами)
router.get('/', noteController.getAllNotes)

// Изменить порядок заметок (ручная сортировка)
router.post('/reorder', noteController.reorderNotes)

// Поиск заметок
router.get('/search', noteController.searchNotes)

// Получить заметку по ID
router.get('/:id', noteController.getNoteById)

// Разблокировать защищённую заметку (проверка пароля на сервере)
router.post('/:id/unlock', noteController.unlockNote)

// Создать новую заметку
router.post('/', noteController.createNote)

// Обновить заметку
router.put('/:id', noteController.updateNote)

// Удалить заметку
router.delete('/:id', noteController.deleteNote)

// Переключить избранное
router.patch('/:id/favorite', noteController.toggleFavorite)

export default router