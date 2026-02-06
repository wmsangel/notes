<template>
  <MainLayout>
    <div class="todos-overview-page">
      <div class="page-header">
        <h1 class="page-title">Все задачи</h1>
        <p class="page-subtitle">Обзор всех списков и задач</p>
      </div>

      <div v-if="loading" class="loading-state">
        <Loader :size="32" class="spinner" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="!lists.length" class="empty-state">
        <ListTodo :size="64" class="empty-icon" />
        <h2 class="empty-title">Нет задач</h2>
        <p class="empty-text">Создайте хотя бы один список задач, чтобы видеть обзор.</p>
        <router-link to="/todos" class="btn btn-primary">
          <Plus :size="18" />
          Перейти к спискам
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
              <h2 class="group-title" :style="{ color: list.color || undefined }">
                {{ list.title }}
              </h2>
              <div v-if="list.folder_name" class="group-folder">
                {{ list.folder_name }}
              </div>
            </div>
            <router-link :to="`/todos/${list.id}`" class="group-link">
              Открыть список
              <ChevronRight :size="16" />
            </router-link>
          </header>

          <div class="group-note-link">
            <span class="group-note-label">Заметка:</span>
            <router-link
              v-if="list.linked_note"
              :to="`/notes/${list.linked_note.id}`"
              class="group-note-chip"
              :style="list.linked_note.color ? { borderLeft: `4px solid ${list.linked_note.color}` } : null"
            >
              {{ list.linked_note.title || 'Без названия' }}
            </router-link>
            <span v-else class="group-note-empty">Нет привязанной заметки</span>
            <button class="btn btn-sm btn-ghost" @click="openListLinkModal(list.id)">Привязать</button>
            <button v-if="list.linked_note" class="btn btn-sm btn-ghost" @click="unlinkListNote(list.id)">Убрать</button>
          </div>

          <div class="group-add">
            <input
              class="input"
              type="text"
              :placeholder="`Добавить задачу в «${list.title}»`"
              v-model="newItemTitles[list.id]"
              @keydown.enter="addItem(list)"
            />
            <button class="btn btn-primary" @click="addItem(list)">Добавить</button>
          </div>

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
                      <button class="drag-handle" type="button" title="Перетащить" @click.stop>⠿</button>
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

          <button
            v-if="listStates[list.id]?.completed?.length"
            class="toggle-completed"
            @click="toggleCompleted(list.id)"
          >
            <ChevronDown
              :size="14"
              class="chevron"
              :class="{ 'chevron--collapsed': !expandedCompleted[list.id] }"
            />
            <span>Выполнено: {{ listStates[list.id].completed.length }}</span>
          </button>

          <div
            v-if="listStates[list.id]?.completed?.length && expandedCompleted[list.id]"
            class="group-items completed"
          >
            <draggable
              v-model="listStates[list.id].completed"
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
                <div class="task-row completed">
                  <TodoItem
                    :item="item"
                    @toggle="(id) => toggleItem(list.id, id)"
                    @update="(id, data) => updateItem(list.id, id, data)"
                    @delete="(id) => deleteItem(list.id, id)"
                  >
                    <template #prepend>
                      <button class="drag-handle" type="button" title="Перетащить" @click.stop>⠿</button>
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
                </div>
              </template>
            </draggable>
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
import { useUIStore } from '@/stores/ui'
import * as todosApi from '@/services/api/todos'
import MainLayout from '@/components/layout/MainLayout.vue'
import TodoItem from '@/components/features/TodoItem.vue'
import { ListTodo, Loader, Plus, ChevronRight, ChevronDown, FileText, Link2 } from 'lucide-vue-next'

const todosStore = useTodosStore()
const notesStore = useNotesStore()
const uiStore = useUIStore()

const loading = ref(true)
const lists = ref([])
const expandedCompleted = ref({})
const listStates = reactive({})
const itemLinks = reactive({})
const newItemTitles = reactive({})

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
    const data = await todosApi.getOverview()
    lists.value = data
    lists.value.forEach(list => initListState(list))
    for (const list of lists.value) {
      for (const item of list.items || []) {
        await loadLinkedNotes(item.id)
      }
    }
    await notesStore.fetchNotes()
    availableNotes.value = notesStore.notes
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

const toggleCompleted = (listId) => {
  expandedCompleted.value[listId] = !expandedCompleted.value[listId]
}

const openItemLinkModal = (listId, itemId) => {
  selectedItemId.value = itemId
  selectedListId.value = listId
  showItemLinkModal.value = true
  noteSearchQuery.value = ''
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

.group-note-link {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px dashed var(--border-subtle);
}

.group-note-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.group-note-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text);
  text-decoration: none;
  font-size: 12px;
}

.group-note-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

.group-add {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
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
  opacity: 0.6;
}

.drag-chosen {
  opacity: 0.9;
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
