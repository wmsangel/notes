<!-- frontend/src/views/Folder.vue -->
<template>
  <MainLayout>
    <div class="folder-page" v-if="folder">
      <div class="page-header">
        <div class="header-left">
          <button class="btn btn-ghost back-btn" @click="goBack">
            <ArrowLeft :size="20" />
          </button>

          <div class="folder-icon" :style="{ color: folder.color }">
            <Folder :size="28" />
          </div>

          <h1 class="page-title">{{ folder.name }}</h1>

          <span class="notes-count" v-if="activeTab === 'notes'">{{ notes.length }}</span>
          <span class="notes-count" v-else>{{ todoItems.length }}</span>
        </div>

        <div class="header-right">
          <div class="folder-tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'notes' }"
              @click="activeTab = 'notes'"
            >
              Заметки
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'tasks' }"
              @click="activeTab = 'tasks'"
            >
              Задачи
            </button>
          </div>

          <div class="view-toggle" v-if="activeTab === 'notes'">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'; saveViewMode()"
              title="Сетка"
            >
              <Grid :size="18" />
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'; saveViewMode()"
              title="Список"
            >
              <List :size="18" />
            </button>
          </div>

          <button class="btn btn-ghost" @click="editFolder">
            <Edit2 :size="18" />
            Редактировать
          </button>

          <button class="btn btn-primary" v-if="activeTab === 'notes'" @click="createNote">
            <Plus :size="18" />
            Создать заметку
          </button>
        </div>
      </div>

      <template v-if="activeTab === 'notes'">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>

        <div v-else-if="!notes.length" class="empty-state">
          <FileText :size="64" class="empty-icon" />
          <h2>В этой папке пока нет заметок</h2>
          <p>Создайте первую заметку в этой папке</p>
          <button class="btn btn-primary" @click="createNote">
            <Plus :size="18" />
            Создать заметку
          </button>
        </div>

        <template v-else>
          <div class="drag-hint" v-if="displayList.length">Перетащите для изменения порядка</div>

          <draggable
            v-if="viewMode === 'grid'"
            v-model="displayList"
            item-key="id"
            class="notes-grid notes-grid--can-reorder"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            handle=".drag-handle"
            :delay="250"
            :delayOnTouchOnly="true"
            :touchStartThreshold="8"
            @end="onReorderEnd"
          >
            <template #item="{ element: note }">
              <div class="note-card-wrap">
                <button
                  class="drag-handle drag-handle--card"
                  type="button"
                  title="Перетащить"
                  aria-label="Перетащить"
                  @click.stop
                >
                  ⠿
                </button>
                <NoteCard
                  :note="note"
                  @delete="handleDelete"
                />
              </div>
            </template>
          </draggable>

          <draggable
            v-else
            v-model="displayList"
            item-key="id"
            class="notes-list notes-list--can-reorder"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            handle=".drag-handle"
            :delay="250"
            :delayOnTouchOnly="true"
            :touchStartThreshold="8"
            @end="onReorderEnd"
          >
            <template #item="{ element: note }">
              <div
                class="note-list-item card card-hover"
                :style="note.color ? { borderLeft: `4px solid ${note.color}` } : null"
                @click="$router.push(`/notes/${note.id}`)"
              >
                <button
                  class="drag-handle drag-handle--row"
                  type="button"
                  title="Перетащить"
                  aria-label="Перетащить"
                  @click.stop
                >
                  ⠿
                </button>
                <div class="list-item-content">
                  <div class="list-item-header">
                    <h3 class="list-item-title">{{ note.title }}</h3>
                    <div class="list-item-badges">
                      <Pin v-if="note.is_pinned" :size="14" class="badge-icon pinned" />
                      <Star v-if="note.is_favorite" :size="14" class="badge-icon favorite" fill="currentColor" />
                    </div>
                  </div>
                  <p class="list-item-preview" v-if="getContentPreview(note)">{{ getContentPreview(note) }}</p>
                  <div class="list-item-footer">
                    <div class="list-item-actions" @click.stop>
                      <button class="btn btn-icon-sm btn-ghost" @click="toggleFavorite(note.id)" :title="note.is_favorite ? 'Убрать из избранного' : 'В избранное'">
                        <Star :size="16" :fill="note.is_favorite ? 'currentColor' : 'none'" />
                      </button>
                      <button class="btn btn-icon-sm btn-ghost" @click="handleDelete(note.id)" title="Удалить">
                        <Trash2 :size="16" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </template>
      </template>

      <template v-else>
        <div v-if="todoLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка задач...</p>
        </div>

        <div v-else class="tasks-section">
          <div class="add-item-section">
            <input
              ref="newItemInput"
              type="text"
              class="input"
              v-model="newItemTitle"
              @keydown.enter="addItem"
              placeholder="Добавить новую задачу..."
            />
            <button class="btn btn-primary" @click="addItem" :disabled="!newItemTitle.trim() || adding">
              <Plus :size="18" />
              Добавить
            </button>
          </div>

          <div class="items-section" v-if="todoItems.length">
            <div class="items-filters">
              <button class="filter-tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">
                Все ({{ todoItems.length }})
              </button>
              <button class="filter-tab" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
                Активные ({{ pendingItems.length }})
              </button>
              <button class="filter-tab" :class="{ active: filter === 'completed' }" @click="filter = 'completed'">
                Выполнено ({{ completedItems.length }})
              </button>
            </div>

            <div class="items-list" v-if="filter === 'all'">
              <draggable
                v-model="todoItems"
                item-key="id"
                handle=".drag-handle"
                ghost-class="drag-ghost"
                chosen-class="drag-chosen"
                :delay="150"
                :delayOnTouchOnly="true"
                :touchStartThreshold="8"
                @end="onReorderEndTodo"
              >
                <template #item="{ element: item }">
                  <TodoItem
                    :item="item"
                    @toggle="toggleItem"
                    @update="updateItem"
                    @delete="deleteItem"
                  >
                    <template #prepend>
                      <button class="drag-handle" type="button" title="Перетащить" @click.stop></button>
                    </template>
                    <template #append-actions>
                      <button
                        class="btn btn-icon-sm btn-ghost"
                        :class="{ active: item.show_on_dashboard }"
                        @click.stop="toggleDashboard(item)"
                        title="Показывать на главной"
                      >
                        <LayoutDashboard :size="16" />
                      </button>
                    </template>
                  </TodoItem>
                </template>
              </draggable>
            </div>

            <div class="items-list" v-else>
              <div v-for="item in filteredItems" :key="item.id" class="todo-item-wrapper">
                <TodoItem
                  :item="item"
                  @toggle="toggleItem"
                  @update="updateItem"
                  @delete="deleteItem"
                >
                  <template #append-actions>
                    <button
                      class="btn btn-icon-sm btn-ghost"
                      :class="{ active: item.show_on_dashboard }"
                      @click.stop="toggleDashboard(item)"
                      title="Показывать на главной"
                    >
                      <LayoutDashboard :size="16" />
                    </button>
                  </template>
                </TodoItem>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <ListTodo :size="64" class="empty-icon" />
            <p>Нет задач в этом проекте</p>
          </div>
        </div>
      </template>
    </div>

    <div v-else-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Загрузка папки...</p>
    </div>

    <div v-else class="error-container">
      <AlertCircle :size="48" />
      <h2>Папка не найдена</h2>
      <button class="btn btn-primary" @click="goBack">
        <ArrowLeft :size="18" />
        Вернуться назад
      </button>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import { useFoldersStore } from '@/stores/folders'
import { useNotesStore } from '@/stores/notes'
import { useTodosStore } from '@/stores/todos'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import NoteCard from '@/components/features/NoteCard.vue'
import TodoItem from '@/components/features/TodoItem.vue'
import FolderModal from '@/components/features/FolderModal.vue'
import { ArrowLeft, Folder, Edit2, Plus, FileText, AlertCircle, Grid, List, Star, Pin, Trash2, ListTodo, LayoutDashboard } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const foldersStore = useFoldersStore()
const notesStore = useNotesStore()
const todosStore = useTodosStore()
const uiStore = useUIStore()

const loading = ref(false)
const folder = ref(null)
const notes = ref([])
const displayList = ref([])
const viewMode = ref(localStorage.getItem('folderViewMode') || 'grid')
const activeTab = ref('notes')

const todoList = ref(null)
const todoItems = ref([])
const todoLoading = ref(false)
const adding = ref(false)
const newItemTitle = ref('')
const newItemInput = ref(null)
const filter = ref('all')

const pendingItems = computed(() => todoItems.value.filter(i => !i.is_completed))
const completedItems = computed(() => todoItems.value.filter(i => i.is_completed))

const filteredItems = computed(() => {
  if (filter.value === 'completed') return completedItems.value
  if (filter.value === 'pending') return pendingItems.value
  return todoItems.value
})

function syncDisplayList() {
  displayList.value = [...notes.value]
}

async function loadFolder() {
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    await Promise.all([
      foldersStore.fetchFolders(),
      foldersStore.fetchFolderTree()
    ])
    folder.value = foldersStore.folders.find(f => String(f.id) === String(id)) || null
    if (!folder.value) {
      loading.value = false
      return
    }
    await loadNotes(id)
  } catch (error) {
    uiStore.showError('Ошибка загрузки папки')
  } finally {
    loading.value = false
  }
}

async function loadNotes(id) {
  try {
    await notesStore.fetchNotes({ folder_id: id })
    notes.value = notesStore.notes
    syncDisplayList()
  } catch (error) {
    uiStore.showError('Ошибка загрузки заметок')
  }
}

async function loadTodoList() {
  if (!folder.value?.id) return
  todoLoading.value = true
  try {
    const list = await todosStore.fetchListByFolder(folder.value.id)
    todoList.value = list
    todoItems.value = list.items || []
  } catch (error) {
    uiStore.showError('Ошибка загрузки задач')
  } finally {
    todoLoading.value = false
  }
}

watch(() => route.params.id, async () => {
  await loadFolder()
  if (activeTab.value === 'tasks') {
    await loadTodoList()
  }
})

watch(activeTab, async (tab) => {
  if (tab === 'tasks') {
    await loadTodoList()
  }
})

onMounted(loadFolder)

function saveViewMode() {
  localStorage.setItem('folderViewMode', viewMode.value)
}

async function onReorderEnd() {
  if (!displayList.value.length) return
  try {
    await notesStore.reorderNotes(displayList.value.map(n => n.id))
    notes.value = notesStore.notes
    syncDisplayList()
  } catch (e) {
    uiStore.showError('Не удалось сохранить порядок')
  }
}

const createNote = async () => {
  try {
    const note = await notesStore.createNote({
      title: '',
      content: '',
      folder_id: folder.value.id
    })
    router.push(`/notes/${note.id}`)
  } catch (error) {
    uiStore.showError('Ошибка при создании заметки')
  }
}

const editFolder = () => {
  uiStore.openModal(FolderModal, { folder: folder.value })
}

const goBack = () => {
  router.push('/notes')
}

const toggleFavorite = async (noteId) => {
  try {
    await notesStore.toggleFavorite(noteId)
    const note = notes.value.find(n => n.id === noteId)
    if (note) note.is_favorite = !note.is_favorite
  } catch (error) {
    uiStore.showError('Ошибка обновления')
  }
}

const handleDelete = async (noteId) => {
  if (!confirm('Удалить эту заметку?')) return
  try {
    await notesStore.deleteNote(noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
    syncDisplayList()
    uiStore.showSuccess('Заметка удалена')
  } catch (error) {
    uiStore.showError('Ошибка при удалении')
  }
}

const getContentPreview = (note) => {
  if (!note.content) return ''
  const text = note.content.replace(/<[^>]*>/g, '').trim()
  return text.length > 150 ? text.substring(0, 150) + '...' : text
}

const addItem = async () => {
  const title = newItemTitle.value.trim()
  if (!title || adding.value || !todoList.value?.id) return
  adding.value = true
  newItemTitle.value = ''
  try {
    const item = await todosStore.createItem({
      list_id: todoList.value.id,
      title,
      priority: 'medium'
    })
    todoItems.value.push(item)
    newItemInput.value?.focus()
    await onReorderEndTodo()
  } catch (error) {
    newItemTitle.value = title
    uiStore.showError('Ошибка добавления задачи')
  } finally {
    adding.value = false
  }
}

const toggleItem = async (itemId) => {
  try {
    const updated = await todosStore.toggleItem(itemId)
    const idx = todoItems.value.findIndex(i => i.id === itemId)
    if (idx !== -1) todoItems.value[idx] = updated
    await onReorderEndTodo()
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const updateItem = async (itemId, data) => {
  try {
    const updated = await todosStore.updateItem(itemId, data)
    const idx = todoItems.value.findIndex(i => i.id === itemId)
    if (idx !== -1) todoItems.value[idx] = updated
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const deleteItem = async (itemId) => {
  if (!confirm('Удалить эту задачу?')) return
  try {
    await todosStore.deleteItem(itemId)
    todoItems.value = todoItems.value.filter(i => i.id !== itemId)
    uiStore.showSuccess('Задача удалена')
    await onReorderEndTodo()
  } catch (error) {
    uiStore.showError('Ошибка удаления задачи')
  }
}

const toggleDashboard = async (item) => {
  try {
    const updated = await todosStore.updateItem(item.id, { show_on_dashboard: !item.show_on_dashboard })
    const idx = todoItems.value.findIndex(i => i.id === item.id)
    if (idx !== -1) todoItems.value[idx] = updated
  } catch (error) {
    uiStore.showError('Ошибка обновления')
  }
}

const onReorderEndTodo = async () => {
  if (!todoItems.value.length || !todoList.value?.id) return
  try {
    await todosStore.reorderItems(todoList.value.id, todoItems.value.map(i => i.id))
  } catch (e) {
    uiStore.showError('Не удалось сохранить порядок')
  }
}
</script>

<style scoped>
.folder-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.folder-tabs {
  display: inline-flex;
  gap: 6px;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
}

.tab-btn.active {
  background: var(--bg);
  color: var(--primary);
}

.view-toggle {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 4px;
  gap: 4px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.view-btn.active {
  background: var(--bg);
  color: var(--primary);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drag-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.note-list-item {
  padding: 10px 16px 10px 50px;
  cursor: pointer;
  position: relative;
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

.drag-handle--row {
  position: absolute;
  left: 12px;
  top: 12px;
}

.drag-handle--card {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
}

.tasks-section {
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 16px;
}

.add-item-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.items-section {
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.items-filters {
  display: flex;
  border-bottom: 1px solid var(--border-light);
}

.filter-tab {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 2px solid transparent;
}

.filter-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: rgba(99, 102, 241, 0.05);
}

.items-list {
  display: flex;
  flex-direction: column;
}

.items-section .btn.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.todo-item-wrapper {
  border-bottom: 1px solid var(--border-light);
}

.todo-item-wrapper:last-child {
  border-bottom: none;
}

.drag-ghost {
  opacity: 0.6;
}

.drag-chosen {
  opacity: 0.9;
}

.loading-state,
.empty-state {
  padding: 80px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .add-item-section {
    flex-direction: column;
  }
}
</style>
