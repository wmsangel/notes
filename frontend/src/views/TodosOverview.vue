<template>
  <MainLayout>
    <div class="todos-overview-page">
      <div class="page-header">
        <h1 class="page-title">Активные задачи</h1>
        <p class="page-subtitle">Все активные задачи из проектов</p>
      </div>

      <div v-if="loading" class="loading-state">
        <Loader :size="32" class="spinner" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="!lists.length" class="empty-state">
        <ListTodo :size="64" class="empty-icon" />
        <h2 class="empty-title">Нет задач</h2>
        <p class="empty-text">Создайте хотя бы один проект, чтобы добавить задачи.</p>
        <router-link to="/notes" class="btn btn-primary">
          <Plus :size="18" />
          Перейти к проектам
        </router-link>
      </div>

      <div v-else class="overview-groups">
        <section
          v-for="list in lists"
          :key="list.id"
          class="overview-group card"
        >
          <header class="group-header">
            <div class="group-title-block">
              <router-link
                class="group-title-link"
                :to="`/todos/${list.id}`"
                :style="{ color: list.color || undefined }"
              >
                {{ list.title }}
              </router-link>
              <div v-if="list.folder_name" class="group-folder">
                {{ list.folder_name }}
              </div>
            </div>
            <button class="btn btn-icon-sm btn-ghost add-inline-btn" @click="focusAddInput(list.id)" title="Добавить задачу">
              <Plus :size="16" />
            </button>
          </header>

          <div v-if="listStates[list.id]?.pending?.length" class="group-items">
            <draggable
              v-model="listStates[list.id].pending"
              item-key="id"
              handle=".drag-handle"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              :delay="150"
              :delayOnTouchOnly="true"
              :touchStartThreshold="8"
              @end="onReorder(list.id)"
            >
              <template #item="{ element: item }">
                <div class="task-row">
                  <TodoItem
                    :item="item"
                    @toggle="(id) => toggleItem(list.id, id)"
                    @update="(id, data) => updateItem(list.id, id, data)"
                    @delete="(id) => deleteItem(list.id, id)"
                  >
                    <template #prepend>
                      <button class="drag-handle" type="button" title="Перетащить" @click.stop></button>
                    </template>
                    <template #append-actions>
                      <button
                        class="btn btn-icon-sm btn-ghost link-note-btn"
                        @click.stop="openItemLinkModal(list.id, item.id)"
                        title="Привязать заметку"
                        aria-label="Привязать заметку"
                      >
                        <Link2 :size="16" />
                      </button>
                    </template>
                  </TodoItem>

                  <div class="linked-notes" v-if="itemLinks[item.id]?.length">
                    <div class="linked-notes-header">
                      <FileText :size="14" />
                      <span>Связанные заметки:</span>
                    </div>
                    <div class="linked-notes-list">
                      <router-link
                        v-for="note in itemLinks[item.id]"
                        :key="note.id"
                        :to="`/notes/${note.id}`"
                        class="linked-note"
                      >
                        <FileText :size="14" />
                        {{ note.title }}
                      </router-link>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <div v-else class="group-empty">
            <span>Нет активных задач</span>
          </div>

          <div class="group-add group-add--footer">
            <input
              :ref="el => setAddInputRef(list.id, el)"
              class="input"
              type="text"
              :placeholder="`Добавить задачу в «${list.title}»`"
              v-model="newItemTitles[list.id]"
              @keydown.enter="addItem(list)"
            />
            <button class="btn btn-primary" @click="addItem(list)">Добавить</button>
          </div>

        </section>
      </div>

      <!-- Модалка привязки заметки к задаче -->
      <div class="link-modal" v-if="showItemLinkModal" @click.self="showItemLinkModal = false">
        <div class="link-dialog card">
          <h3>Привязать заметку</h3>

          <input
            type="text"
            class="input"
            v-model="noteSearchQuery"
            placeholder="Поиск заметок..."
          />

          <div class="notes-list-modal">
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-item-modal"
              @click="linkNoteToItem(note.id)"
            >
              <FileText :size="16" />
              <div class="note-item-modal-text">
                <span class="note-item-modal-title">{{ note.title }}</span>
                <span v-if="note.folder_id" class="note-item-modal-folder">
                  {{ getNoteFolderPath(note.folder_id) }}
                </span>
              </div>
            </div>
            <div v-if="!filteredNotes.length" class="no-notes">Заметки не найдены</div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showItemLinkModal = false">Отмена</button>
          </div>
        </div>
      </div>

      <!-- Модалка привязки заметки к списку -->
      <div class="link-modal" v-if="showListLinkModal" @click.self="showListLinkModal = false">
        <div class="link-dialog card">
          <h3>Привязать заметку к списку</h3>

          <input
            type="text"
            class="input"
            v-model="listNoteSearchQuery"
            placeholder="Поиск заметок..."
          />

          <div class="notes-list-modal">
            <div
              v-for="note in filteredListNotes"
              :key="note.id"
              class="note-item-modal"
              @click="linkNoteToList(note.id)"
            >
              <FileText :size="16" />
              <div class="note-item-modal-text">
                <span class="note-item-modal-title">{{ note.title }}</span>
                <span v-if="note.folder_id" class="note-item-modal-folder">
                  {{ getNoteFolderPath(note.folder_id) }}
                </span>
              </div>
            </div>
            <div v-if="!filteredListNotes.length" class="no-notes">Заметки не найдены</div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showListLinkModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useTodosStore } from '@/stores/todos'
import { useNotesStore } from '@/stores/notes'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import * as todosApi from '@/services/api/todos'
import MainLayout from '@/components/layout/MainLayout.vue'
import TodoItem from '@/components/features/TodoItem.vue'
import { ListTodo, Loader, Plus, FileText, Link2 } from 'lucide-vue-next'

const todosStore = useTodosStore()
const notesStore = useNotesStore()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const loading = ref(true)
const lists = ref([])
const listStates = reactive({})
const itemLinks = reactive({})
const newItemTitles = reactive({})
const addInputRefs = reactive({})

const showItemLinkModal = ref(false)
const showListLinkModal = ref(false)
const noteSearchQuery = ref('')
const listNoteSearchQuery = ref('')
const selectedItemId = ref(null)
const selectedListId = ref(null)
const availableNotes = ref([])

const filteredNotes = computed(() => {
  if (!noteSearchQuery.value) return availableNotes.value
  const q = noteSearchQuery.value.toLowerCase()
  return availableNotes.value.filter(n => n.title.toLowerCase().includes(q))
})

const filteredListNotes = computed(() => {
  if (!listNoteSearchQuery.value) return availableNotes.value
  const q = listNoteSearchQuery.value.toLowerCase()
  return availableNotes.value.filter(n => n.title.toLowerCase().includes(q))
})

const getNoteFolderPath = (folderId) => {
  if (!folderId) return ''
  const path = foldersStore.getFolderPath(folderId)
  if (!path.length) return ''
  return path.map(f => f.name).join(' / ')
}

const initListState = (list) => {
  const pending = (list.items || []).filter(i => !i.is_completed)
  const completed = (list.items || []).filter(i => i.is_completed)
  listStates[list.id] = { pending, completed }
}

const refreshListItems = (listId) => {
  const state = listStates[listId]
  if (!state) return
  const list = lists.value.find(l => l.id === listId)
  if (list) list.items = [...state.pending, ...state.completed]
}

const loadOverview = async () => {
  loading.value = true
  try {
    const data = await todosApi.getOverview({ include_completed: 0 })
    lists.value = data
    lists.value.forEach(list => initListState(list))
  } finally {
    loading.value = false
  }
}

const loadLinkedNotes = async (itemId) => {
  try {
    const notes = await todosStore.getLinkedNotes(itemId)
    itemLinks[itemId] = notes
  } catch {}
}

const addItem = async (list) => {
  const title = (newItemTitles[list.id] || '').trim()
  if (!title) return
  try {
    const item = await todosStore.createItem({ list_id: list.id, title, priority: 'medium' })
    listStates[list.id].pending.push(item)
    refreshListItems(list.id)
    newItemTitles[list.id] = ''
    await onReorder(list.id)
  } catch (e) {
    uiStore.showError('Ошибка добавления задачи')
  }
}

const setAddInputRef = (listId, el) => {
  if (!el) return
  addInputRefs[listId] = el
}

const focusAddInput = (listId) => {
  const el = addInputRefs[listId]
  if (el && typeof el.focus === 'function') {
    el.focus()
  }
}

const toggleItem = async (listId, itemId) => {
  try {
    const updated = await todosStore.toggleItem(itemId)
    const state = listStates[listId]
    if (!state) return
    const from = updated.is_completed ? state.pending : state.completed
    const to = updated.is_completed ? state.completed : state.pending
    const idx = from.findIndex(i => i.id === itemId)
    if (idx !== -1) from.splice(idx, 1)
    to.push(updated)
    refreshListItems(listId)
    await onReorder(listId)
  } catch (e) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const updateItem = async (listId, itemId, data) => {
  try {
    const updated = await todosStore.updateItem(itemId, data)
    const state = listStates[listId]
    if (!state) return
    const target = updated.is_completed ? state.completed : state.pending
    const idx = target.findIndex(i => i.id === itemId)
    if (idx !== -1) target[idx] = updated
    refreshListItems(listId)
  } catch (e) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const deleteItem = async (listId, itemId) => {
  if (!confirm('Удалить эту задачу?')) return
  try {
    await todosStore.deleteItem(itemId)
    const state = listStates[listId]
    if (!state) return
    state.pending = state.pending.filter(i => i.id !== itemId)
    state.completed = state.completed.filter(i => i.id !== itemId)
    listStates[listId] = state
    refreshListItems(listId)
    await onReorder(listId)
  } catch (e) {
    uiStore.showError('Ошибка удаления задачи')
  }
}

const onReorder = async (listId) => {
  const state = listStates[listId]
  if (!state) return
  refreshListItems(listId)
  try {
    const order = [...state.pending, ...state.completed].map(i => i.id)
    await todosStore.reorderItems(listId, order)
  } catch (e) {
    uiStore.showError('Не удалось сохранить порядок')
  }
}


const ensureNotesLoaded = async () => {
  if (availableNotes.value.length) return
  try {
    await notesStore.fetchNotes()
    availableNotes.value = notesStore.notes
    if (!foldersStore.folders.length) {
      await foldersStore.fetchFolders()
    }
  } catch (e) {
    uiStore.showError('Ошибка загрузки заметок')
  }
}

const openItemLinkModal = (listId, itemId) => {
  selectedItemId.value = itemId
  selectedListId.value = listId
  showItemLinkModal.value = true
  noteSearchQuery.value = ''
  ensureNotesLoaded()
  loadLinkedNotes(itemId)
}

const linkNoteToItem = async (noteId) => {
  try {
    await todosStore.linkNoteToItem(selectedItemId.value, noteId)
    await loadLinkedNotes(selectedItemId.value)
    showItemLinkModal.value = false
  } catch (e) {
    uiStore.showError('Ошибка привязки заметки')
  }
}

const openListLinkModal = (listId) => {
  selectedListId.value = listId
  showListLinkModal.value = true
  listNoteSearchQuery.value = ''
  ensureNotesLoaded()
}

const linkNoteToList = async (noteId) => {
  try {
    const updated = await todosStore.linkNoteToList(selectedListId.value, noteId)
    const idx = lists.value.findIndex(l => l.id === selectedListId.value)
    if (idx !== -1) lists.value[idx] = updated
    initListState(lists.value[idx])
    showListLinkModal.value = false
  } catch (e) {
    uiStore.showError('Ошибка привязки заметки')
  }
}

const unlinkListNote = async (listId) => {
  try {
    const updated = await todosStore.linkNoteToList(listId, null)
    const idx = lists.value.findIndex(l => l.id === listId)
    if (idx !== -1) lists.value[idx] = updated
    initListState(lists.value[idx])
  } catch (e) {
    uiStore.showError('Ошибка обновления списка')
  }
}

onMounted(loadOverview)
</script>

<style scoped>
.todos-overview-page {
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-secondary);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
}

.empty-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  max-width: 360px;
}

.overview-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-group {
  padding: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.add-inline-btn {
  color: var(--text-tertiary);
}

.add-inline-btn:hover {
  color: var(--primary);
}

.group-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.group-title-link {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  text-decoration: none;
  color: var(--text);
}

.group-title-link:hover {
  color: var(--primary);
}

.group-folder {
  font-size: 12px;
  color: var(--text-tertiary);
}

.group-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
}

.group-link:hover {
  color: var(--primary);
}

.group-add {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.group-add--footer {
  border-top: 1px dashed var(--border-subtle);
  border-bottom: none;
}

.group-items {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-items.completed {
  border-top: 1px dashed var(--border-subtle);
  padding-top: 6px;
}

.task-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-row.completed {
  opacity: 0.7;
}

.group-empty {
  padding: 10px 12px 12px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.toggle-completed {
  width: 100%;
  border: none;
  background: transparent;
  border-top: 1px solid var(--border-subtle);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.toggle-completed:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.chevron {
  transition: transform 0.2s var(--ease);
}

.chevron--collapsed {
  transform: rotate(-90deg);
}

.linked-notes {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.linked-notes-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.linked-notes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.linked-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text);
  font-size: 13px;
}

.linked-note:hover {
  background: var(--bg-tertiary);
  color: var(--primary);
}

.link-note-btn {
  color: var(--text-tertiary);
}

.link-note-btn:hover {
  color: var(--primary);
}

.drag-ghost {
  opacity: 0.45;
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius);
}

.drag-chosen {
  opacity: 1;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
}

.drag-handle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  color: transparent;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
}

.drag-handle::before {
  content: '';
  width: 12px;
  height: 12px;
  background-image:
    radial-gradient(currentColor 1.6px, transparent 1.6px),
    radial-gradient(currentColor 1.6px, transparent 1.6px),
    radial-gradient(currentColor 1.6px, transparent 1.6px),
    radial-gradient(currentColor 1.6px, transparent 1.6px),
    radial-gradient(currentColor 1.6px, transparent 1.6px),
    radial-gradient(currentColor 1.6px, transparent 1.6px);
  background-size: 4px 4px;
  background-position:
    0 0, 4px 0, 8px 0,
    0 4px, 4px 4px, 8px 4px;
  color: var(--text-tertiary);
}

.drag-handle:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
}

.drag-handle:hover::before {
  color: var(--primary);
}

.drag-handle:active {
  cursor: grabbing;
}

.link-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.link-dialog {
  max-width: 500px;
  width: 100%;
  padding: 24px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.notes-list-modal {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.note-item-modal {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.note-item-modal:hover {
  background: var(--bg-tertiary);
  color: var(--primary);
}

.note-item-modal-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.note-item-modal-title {
  font-size: 14px;
  font-weight: 500;
}

.note-item-modal-folder {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-notes {
  padding: 40px;
  text-align: center;
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .todos-overview-page {
    max-width: 100%;
  }
  .group-add {
    flex-direction: column;
  }
}
</style>
