// backend/routes/todos.js
import express from 'express'
import { todoController } from '../controllers/todoController.js'

const router = express.Router()

// TODO Lists
router.get('/lists', todoController.getAllLists)
router.get('/overview', todoController.getOverview)
router.get('/lists/:id', todoController.getListById)
router.get('/folder/:folderId', todoController.getListByFolder)
router.post('/lists', todoController.createList)
router.put('/lists/:id', todoController.updateList)
router.post('/lists/:id/link-note', todoController.linkNoteToList)
router.delete('/lists/:id', todoController.deleteList)

// TODO Items
router.post('/items', todoController.createItem)
router.put('/items/:id', todoController.updateItem)
router.patch('/items/:id/toggle', todoController.toggleItem)
router.delete('/items/:id', todoController.deleteItem)
router.post('/items/reorder', todoController.reorderItems)

// Note Links
router.post('/items/link-note', todoController.linkNote)
router.post('/items/unlink-note', todoController.unlinkNote)
router.get('/items/:itemId/notes', todoController.getLinkedNotes)

export default router
