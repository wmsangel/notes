<!-- frontend/src/views/TodoList.vue - ФИНАЛЬНАЯ ВЕРСИЯ -->
<template>
  <MainLayout>
    <div class="todo-list-page" v-if="list">
      <div class="page-header">
        <button class="btn btn-ghost back-btn" @click="goBack">
          <ArrowLeft :size="20" />
          Назад
        </button>

        <div class="header-actions">
          <button class="btn btn-secondary" @click="editList">
            <Edit2 :size="18" />
            Редактировать
          </button>

          <button class="btn btn-ghost" @click="deleteList">
            <Trash2 :size="18" />
          </button>
        </div>
      </div>

      <div class="list-info">
        <div class="list-header-row">
          <h1 class="list-title" :style="{ color: list.color }">{{ list.title }}</h1>

          <!-- Теги -->
          <div class="list-tags" v-if="list.tags && list.tags.length">
            <span
                v-for="tag in list.tags"
                :key="tag"
                class="tag-badge"
                :style="{ background: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <p class="list-description" v-if="list.description">{{ list.description }}</p>

        <div class="list-note-link">
          <span class="list-note-label">Заметка:</span>
          <router-link
            v-if="list.linked_note"
            :to="`/notes/${list.linked_note.id}`"
            class="list-note-chip"
            :style="list.linked_note.color ? { borderLeft: `1px solid ${list.linked_note.color}` } : null"
          >
            {{ list.linked_note.title || 'Без названия' }}
          </router-link>
          <span v-else class="list-note-empty">Нет привязанной заметки</span>
          <button class="btn btn-sm btn-ghost" @click="openLinkListModal">Привязать</button>
          <button v-if="list.linked_note" class="btn btn-sm btn-ghost" @click="unlinkNoteFromList">Убрать</button>
        </div>

      </div>

      <div class="add-item-section">
        <input
            ref="newItemInput"
            type="text"
            class="input"
            v-model="newItemTitle"
            @keydown.enter="addItem"
            placeholder="Добавить новую задачу..."
        />
        <button
            class="btn btn-primary"
            @click="addItem"
            :disabled="!newItemTitle.trim() || adding"
        >
          <Plus :size="18" />
          Добавить
        </button>
      </div>

      <div class="items-section" v-if="items.length">
        <div class="items-filters">
          <button
              class="filter-tab"
              :class="{ 'active': filter === 'all' }"
              @click="filter = 'all'"
          >
            Все ({{ items.length }})
          </button>
          <button
            class="filter-tab"
            :class="{ 'active': filter === 'pending' }"
            @click="filter = 'pending'"
          >
            Активные ({{ pendingCount }})
          </button>
          <button
              class="filter-tab"
              :class="{ 'active': filter === 'completed' }"
              @click="filter = 'completed'"
          >
            Выполнено ({{ completedCount }})
          </button>
        </div>

        <div class="items-list" v-if="filter === 'all'">
          <draggable
            v-model="items"
            item-key="id"
            handle=".drag-handle"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            :delay="150"
            :delayOnTouchOnly="true"
            :touchStartThreshold="8"
            @end="onReorderEnd"
          >
            <template #item="{ element: item }">
              <div class="todo-item-wrapper">
                <TodoItem
                  :item="item"
                  @toggle="toggleItem"
                  @update="updateItem"
                  @delete="deleteItem"
                >
                  <template #prepend>
                    <button class="drag-handle" type="button" title="Перетащить" @click.stop>
                      <GripVertical :size="18" stroke-width="2" />
                    </button>
                  </template>
                  <template #append-actions>
                    <button
                        class="btn btn-icon-sm btn-ghost link-note-btn"
                        @click.stop="openLinkNoteModal(item.id)"
                        title="Привязать заметку"
                        aria-label="Привязать заметку"
                    >
                      <Link2 :size="16" />
                    </button>
                  </template>
                </TodoItem>

                <!-- Привязанные заметки -->
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

        <div class="items-list" v-else>
          <div
              v-for="item in filteredItems"
              :key="item.id"
              class="todo-item-wrapper"
          >
            <TodoItem
                :item="item"
                @toggle="toggleItem"
                @update="updateItem"
                @delete="deleteItem"
            >
              <template #append-actions>
                <button
                    class="btn btn-icon-sm btn-ghost link-note-btn"
                    @click.stop="openLinkNoteModal(item.id)"
                    title="Привязать заметку"
                    aria-label="Привязать заметку"
                >
                  <Link2 :size="16" />
                </button>
              </template>
            </TodoItem>

            <!-- Привязанные заметки -->
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
        </div>
      </div>

      <div v-else class="empty-state">
        <ListTodo :size="64" class="empty-icon" />
        <p>Нет задач в этом списке</p>
      </div>
    </div>

    <!-- Модалка привязки заметки -->
    <div class="link-modal" v-if="showLinkModal" @click.self="showLinkModal = false">
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
              @click="linkNote(note.id)"
          >
            <FileText :size="16" />
            <div class="note-item-modal-text">
              <span class="note-item-modal-title">{{ note.title }}</span>
              <span
                  v-if="note.folder_id"
                  class="note-item-modal-folder"
              >
                {{ getNoteFolderPath(note.folder_id) }}
              </span>
            </div>
          </div>

          <div v-if="!filteredNotes.length" class="no-notes">
            Заметки не найдены
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showLinkModal = false">
            Отмена
          </button>
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
              <span
                  v-if="note.folder_id"
                  class="note-item-modal-folder"
              >
                {{ getNoteFolderPath(note.folder_id) }}
              </span>
            </div>
          </div>

          <div v-if="!filteredListNotes.length" class="no-notes">
            Заметки не найдены
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showListLinkModal = false">
            Отмена
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTodosStore } from '@/stores/todos'
import { useNotesStore } from '@/stores/notes'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import TodoItem from '@/components/features/TodoItem.vue'
import TodoListModal from '@/components/features/TodoListModal.vue'
import draggable from 'vuedraggable'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Plus,
  ListTodo,
  FileText,
  Link2,
  GripVertical
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const todosStore = useTodosStore()
const notesStore = useNotesStore()
const uiStore = useUIStore()
const foldersStore = useFoldersStore()

const loading = ref(false)
const adding = ref(false)
const list = ref(null)
const items = ref([])
const newItemTitle = ref('')
const newItemInput = ref(null)
const filter = ref('all')
const itemLinks = ref({}) // { itemId: [notes] }
const showLinkModal = ref(false)
const selectedItemId = ref(null)
const noteSearchQuery = ref('')
const availableNotes = ref([])
const showListLinkModal = ref(false)
const listNoteSearchQuery = ref('')

const completedCount = computed(() => items.value.filter(i => i.is_completed).length)
const pendingCount = computed(() => items.value.filter(i => !i.is_completed).length)

const filteredItems = computed(() => {
  if (filter.value === 'completed') {
    return items.value.filter(i => i.is_completed)
  } else if (filter.value === 'pending') {
    return items.value.filter(i => !i.is_completed)
  }
  return items.value
})

const filteredNotes = computed(() => {
  if (!noteSearchQuery.value) return availableNotes.value

  const query = noteSearchQuery.value.toLowerCase()
  return availableNotes.value.filter(note =>
      note.title.toLowerCase().includes(query)
  )
})

const filteredListNotes = computed(() => {
  if (!listNoteSearchQuery.value) return availableNotes.value
  const query = listNoteSearchQuery.value.toLowerCase()
  return availableNotes.value.filter(note => note.title.toLowerCase().includes(query))
})

const getNoteFolderPath = (folderId) => {
  if (!folderId) return ''
  const path = foldersStore.getFolderPath(folderId)
  if (!path.length) return ''
  return path.map(f => f.name).join(' / ')
}

onMounted(async () => {
  loading.value = true

  try {
    const data = await todosStore.fetchListById(route.params.id)
    list.value = data
    items.value = data.items || []

    // Загружаем связанные заметки для каждой задачи
    for (const item of items.value) {
      await loadLinkedNotes(item.id)
    }

    // Загружаем все заметки для модалки
    await notesStore.fetchNotes()
    availableNotes.value = notesStore.notes

    if (!foldersStore.folders.length) {
      await foldersStore.fetchFolders()
    }
  } catch (error) {
    uiStore.showError('Ошибка загрузки списка')
  } finally {
    loading.value = false
  }
})

const loadLinkedNotes = async (itemId) => {
  try {
    const notes = await todosStore.getLinkedNotes(itemId)
    itemLinks.value[itemId] = notes
  } catch (error) {
    console.error('Error loading linked notes:', error)
  }
}

const addItem = async () => {
  const title = newItemTitle.value.trim()
  if (!title || adding.value) return

  adding.value = true
  newItemTitle.value = ''

  try {
    const item = await todosStore.createItem({
      list_id: list.value.id,
      title,
      priority: 'medium'
    })
    items.value.push(item)
    newItemInput.value?.focus()
    await onReorderEnd()
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
    const index = items.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      items.value[index] = updated
    }
    await onReorderEnd()
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const updateItem = async (itemId, data) => {
  try {
    const updated = await todosStore.updateItem(itemId, data)
    const index = items.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      items.value[index] = updated
    }
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const deleteItem = async (itemId) => {
  if (!confirm('Удалить эту задачу?')) return

  try {
    await todosStore.deleteItem(itemId)
    items.value = items.value.filter(i => i.id !== itemId)
    uiStore.showSuccess('Задача удалена')
    await onReorderEnd()
  } catch (error) {
    uiStore.showError('Ошибка удаления задачи')
  }
}

const openLinkNoteModal = (itemId) => {
  selectedItemId.value = itemId
  showLinkModal.value = true
  noteSearchQuery.value = ''
}

const openLinkListModal = () => {
  showListLinkModal.value = true
  listNoteSearchQuery.value = ''
}

const linkNote = async (noteId) => {
  try {
    await todosStore.linkNoteToItem(selectedItemId.value, noteId)
    await loadLinkedNotes(selectedItemId.value)
    uiStore.showSuccess('Заметка привязана')
    showLinkModal.value = false
  } catch (error) {
    uiStore.showError('Ошибка привязки заметки')
  }
}

const linkNoteToList = async (noteId) => {
  try {
    const updated = await todosStore.linkNoteToList(list.value.id, noteId)
    list.value = updated
    showListLinkModal.value = false
  } catch (error) {
    uiStore.showError('Ошибка привязки заметки')
  }
}

const unlinkNoteFromList = async () => {
  try {
    const updated = await todosStore.linkNoteToList(list.value.id, null)
    list.value = updated
  } catch (error) {
    uiStore.showError('Ошибка обновления списка')
  }
}

const editList = () => {
  uiStore.openModal(TodoListModal, {
    initialList: list.value,
    onUpdated: async (updated) => {
      list.value = updated ?? await todosStore.fetchListById(list.value.id)
    }
  })
}

const deleteList = async () => {
  if (!confirm('Удалить этот список задач?')) return

  try {
    await todosStore.deleteList(list.value.id)
    uiStore.showSuccess('Список удален')
    router.push('/todos')
  } catch (error) {
    uiStore.showError('Ошибка удаления списка')
  }
}

const goBack = () => {
  router.push('/todos')
}

const onReorderEnd = async () => {
  if (!items.value.length) return
  try {
    await todosStore.reorderItems(list.value.id, items.value.map(i => i.id))
  } catch (e) {
    uiStore.showError('Не удалось сохранить порядок')
  }
}

const getTagColor = (tag) => {
  const colors = {
    'важно': 'rgba(239, 68, 68, 0.2)',
    'срочно': 'rgba(245, 158, 11, 0.2)',
    'работа': 'rgba(99, 102, 241, 0.2)',
    'личное': 'rgba(16, 185, 129, 0.2)'
  }
  return colors[tag.toLowerCase()] || 'rgba(107, 114, 128, 0.2)'
}
</script>

<style scoped>
.todo-list-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.list-info {
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 18px 20px;
  margin-bottom: 16px;
}

.list-header-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 8px;
}

.list-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  flex: 1;
}

.list-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.list-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.list-note-link {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.list-note-label {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.list-note-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text);
  text-decoration: none;
  font-size: 12px;
  border: 1px solid var(--border-subtle);
}

.list-note-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

.add-item-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.add-item-section .input {
  flex: 1;
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

.filter-tab:hover {
  color: var(--text);
  background: var(--bg-secondary);
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

.todo-item-wrapper {
  border-bottom: 1px solid var(--border-light);
}

.todo-item-wrapper:last-child {
  border-bottom: none;
}

.linked-notes {
  padding: 12px 20px;
  background: var(--bg-secondary);
}

.linked-notes-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 8px;
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
  padding: 8px 12px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text);
  font-size: 14px;
  transition: var(--transition);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

/* Модалка */
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

.link-dialog h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
}

.link-dialog .input {
  margin-bottom: 16px;
}

.notes-list-modal {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
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
  .list-info {
    padding: 24px 20px;
  }

  .list-title {
    font-size: 24px;
  }

  .add-item-section {
    flex-direction: column;
  }

  .items-filters {
    flex-direction: column;
  }

  .filter-tab {
    border-bottom: 1px solid var(--border-light);
  }

  .filter-tab.active {
    border-left: 3px solid var(--primary);
  }
}
</style>
