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

          <span class="notes-count">{{ notes.length }}</span>
        </div>

        <div class="header-right">
          <div class="view-toggle">
            <button
                class="view-btn"
                :class="{ 'active': viewMode === 'grid' }"
                @click="viewMode = 'grid'; saveViewMode()"
                title="Сетка"
            >
              <Grid :size="18" />
            </button>
            <button
                class="view-btn"
                :class="{ 'active': viewMode === 'list' }"
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

          <button class="btn btn-primary" @click="createNote">
            <Plus :size="18" />
            Создать заметку
          </button>
        </div>
      </div>

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
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import { useFoldersStore } from '@/stores/folders'
import { useNotesStore } from '@/stores/notes'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import NoteCard from '@/components/features/NoteCard.vue'
import FolderModal from '@/components/features/FolderModal.vue'
import { ArrowLeft, Folder, Edit2, Plus, FileText, AlertCircle, Grid, List, Star, Pin, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const foldersStore = useFoldersStore()
const notesStore = useNotesStore()
const uiStore = useUIStore()

const loading = ref(false)
const folder = ref(null)
const notes = ref([])
const displayList = ref([])
const viewMode = ref(localStorage.getItem('folderViewMode') || 'grid')

function syncDisplayList() {
  displayList.value = [...notes.value]
}

async function loadFolder() {
  const id = route.params.id
  if (!id) return

  loading.value = true
  folder.value = null
  notes.value = []
  displayList.value = []

  try {
    await foldersStore.fetchFolders()
    folder.value = foldersStore.folders.find(f => f.id == id)

    if (folder.value) {
      await notesStore.fetchNotes({ folder_id: folder.value.id })
      notes.value = notesStore.notes
      syncDisplayList()
    }
  } catch (error) {
    uiStore.showError('Ошибка загрузки папки')
  } finally {
    loading.value = false
  }
}

watch(notes, syncDisplayList, { deep: true })

onMounted(loadFolder)

watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadFolder()
  }
})

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

const handleDelete = async (noteId) => {
  if (!confirm('Удалить заметку?')) return

  try {
    await notesStore.deleteNote(noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
    uiStore.showSuccess('Заметка удалена')
  } catch (error) {
    uiStore.showError('Ошибка при удалении')
  }
}

const goBack = () => {
  router.push('/')
}

const getContentPreview = (note) => {
  if (!note?.content) return ''
  const text = note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 120) + (text.length > 120 ? '…' : '')
}

const toggleFavorite = async (noteId) => {
  const note = notes.value.find(n => n.id === noteId)
  if (!note) return
  try {
    await notesStore.updateNote(noteId, { is_favorite: !note.is_favorite })
    note.is_favorite = !note.is_favorite
  } catch (error) {
    uiStore.showError('Ошибка обновления')
  }
}

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
</script>

<style scoped>
.folder-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding: 8px;
}

.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.notes-count {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  gap: 12px;
}

.loading-state,
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.loading-state p,
.loading-container p {
  margin-top: 16px;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.error-container svg {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 16px;
}

.error-container h2 {
  font-size: 24px;
  color: var(--text);
  margin: 0 0 16px 0;
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

.view-btn:hover { color: var(--text); }
.view-btn.active { background: var(--bg); color: var(--primary); }

.drag-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.drag-ghost {
  opacity: 0.5;
}

.drag-chosen {
  opacity: 0.9;
}

.notes-grid.notes-grid--can-reorder,
.notes-list.notes-list--can-reorder {
  cursor: grab;
}

.notes-grid.notes-grid--can-reorder:active,
.notes-list.notes-list--can-reorder:active {
  cursor: grabbing;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card-wrap {
  position: relative;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-overlay);
  color: var(--text-tertiary);
  border-radius: 10px;
  cursor: grab;
  user-select: none;
  touch-action: manipulation;
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

.note-list-item {
  padding: 20px 20px 20px 54px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.list-item-content { display: flex; flex-direction: column; gap: 8px; }
.list-item-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.list-item-title { font-size: 16px; font-weight: 600; color: var(--text); margin: 0; flex: 1; line-height: 1.4; }
.list-item-badges { display: flex; gap: 4px; }
.badge-icon.pinned { color: var(--primary); }
.badge-icon.favorite { color: var(--warning); }
.list-item-preview { font-size: 14px; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.list-item-footer { display: flex; align-items: center; justify-content: flex-end; margin-top: 4px; }
.list-item-actions { display: flex; gap: 4px; }

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>