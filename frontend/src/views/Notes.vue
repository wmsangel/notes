<!-- frontend/src/views/Notes.vue -->
<template>
  <MainLayout>
    <div class="notes-page" :class="{ 'can-reorder': filter === 'all' }">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <FileText :size="32" />
            Заметки
          </h1>
          <span class="notes-count">{{ filteredNotes.length }}</span>
        </div>

        <div class="header-right">
          <!-- Переключатель вида -->
          <div class="view-toggle">
            <button
                class="view-btn"
                :class="{ 'active': viewMode === 'grid' }"
                @click="viewMode = 'grid'"
                title="Сетка"
            >
              <Grid :size="18" />
            </button>
            <button
                class="view-btn"
                :class="{ 'active': viewMode === 'list' }"
                @click="viewMode = 'list'"
                title="Список"
            >
              <List :size="18" />
            </button>
          </div>

          <button class="btn btn-primary" @click="createNote">
            <Plus :size="18" />
            Создать заметку
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <div class="filter-buttons">
          <button
              class="filter-btn"
              :class="{ 'active': filter === 'all' }"
              @click="filter = 'all'"
          >
            Все ({{ notes.length }})
          </button>
          <button
              class="filter-btn"
              :class="{ 'active': filter === 'pinned' }"
              @click="filter = 'pinned'"
          >
            <Pin :size="16" />
            Закрепленные ({{ pinnedCount }})
          </button>
          <button
              class="filter-btn"
              :class="{ 'active': filter === 'recent' }"
              @click="filter = 'recent'"
          >
            <Clock :size="16" />
            Недавние
          </button>
        </div>

        <span v-if="filter === 'all' && displayList.length" class="drag-hint">Перетащите для изменения порядка</span>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="!filteredNotes.length" class="empty-state">
        <FileText :size="64" class="empty-icon" />
        <h2>Нет заметок</h2>
        <p>Создайте первую заметку прямо сейчас</p>
        <button class="btn btn-primary" @click="createNote">
          <Plus :size="18" />
          Создать заметку
        </button>
      </div>

      <!-- Grid view -->
      <draggable
          v-else-if="viewMode === 'grid'"
          v-model="displayList"
          :disabled="filter !== 'all'"
          item-key="id"
          class="notes-grid"
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
              v-if="filter === 'all'"
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

      <!-- List view -->
      <draggable
          v-else
          v-model="displayList"
          :disabled="filter !== 'all'"
          item-key="id"
          class="notes-list"
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
            v-if="filter === 'all'"
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
              <h3 class="list-item-title">{{ note.title || 'Без названия' }}</h3>
              <div class="list-item-badges">
                <Lock v-if="note.is_protected" :size="14" class="badge-icon protected" title="Защищена паролем" />
                <Pin v-if="note.is_pinned" :size="14" class="badge-icon pinned" />
                <Star v-if="note.is_favorite" :size="14" class="badge-icon favorite" fill="currentColor" />
              </div>
            </div>

            <div class="list-item-footer">
              <div class="list-item-actions" @click.stop>
                <button
                    class="btn btn-icon-sm btn-ghost"
                    @click="toggleFavorite(note.id)"
                    :title="note.is_favorite ? 'Убрать из избранного' : 'В избранное'"
                >
                  <Star :size="16" :fill="note.is_favorite ? 'currentColor' : 'none'" />
                </button>
                <button
                    class="btn btn-icon-sm btn-ghost"
                    @click="handleDelete(note.id)"
                    title="Удалить"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </template>
      </draggable>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useNotesStore } from '@/stores/notes'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import NoteCard from '@/components/features/NoteCard.vue'
import { FileText, Plus, Pin, Clock, Star, Trash2, Grid, List, Lock } from 'lucide-vue-next'

const router = useRouter()
const notesStore = useNotesStore()
const uiStore = useUIStore()

const loading = ref(false)
const notes = ref([])
const filter = ref('all')
const viewMode = ref(localStorage.getItem('notesViewMode') || 'grid')
const displayList = ref([])

// Сохраняем вид в localStorage
const saveViewMode = () => {
  localStorage.setItem('notesViewMode', viewMode.value)
}

watch(viewMode, saveViewMode)

const pinnedCount = computed(() => notes.value.filter(n => n.is_pinned).length)

const filteredNotes = computed(() => {
  if (filter.value === 'all') {
    return notes.value
  } else if (filter.value === 'pinned') {
    return notes.value.filter(n => n.is_pinned)
  } else if (filter.value === 'recent') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return notes.value.filter(n => new Date(n.updated_at) > weekAgo)
  }
  return notes.value
})

function syncDisplayList() {
  displayList.value = [...filteredNotes.value]
}

async function loadNotes() {
  loading.value = true
  try {
    const tag = router.currentRoute.value.query.tag
    await notesStore.fetchNotes(tag ? { tag } : {})
    notes.value = notesStore.notes
    syncDisplayList()
  } catch (error) {
    uiStore.showError('Ошибка загрузки заметок')
  } finally {
    loading.value = false
  }
}

watch([notes, filter], syncDisplayList, { deep: true })

onMounted(async () => {
  await loadNotes()
  window.addEventListener('create-note', createNote)
})

watch(() => router.currentRoute.value.query.tag, () => {
  loadNotes()
})

async function onReorderEnd() {
  if (filter.value !== 'all' || !displayList.value.length) return
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
      content: ''
    })
    router.push(`/notes/${note.id}`)
  } catch (error) {
    const msg = error?.response?.data?.error || error?.message || 'Ошибка при создании заметки'
    uiStore.showError(msg)
  }
}

const toggleFavorite = async (noteId) => {
  try {
    await notesStore.toggleFavorite(noteId)
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.is_favorite = !note.is_favorite
    }
  } catch (error) {
    uiStore.showError('Ошибка обновления')
  }
}

const handleDelete = async (noteId) => {
  if (!confirm('Удалить эту заметку?')) return

  try {
    await notesStore.deleteNote(noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
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
</script>

<style scoped>
.notes-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
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

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.notes-count {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
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

.view-btn:hover {
  color: var(--text);
}

.view-btn.active {
  background: var(--bg);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
}

.filter-btn:hover {
  background: var(--bg-secondary);
  color: var(--text);
}

.filter-btn.active {
  background: var(--primary);
  color: white;
}

.drag-ghost {
  opacity: 0.5;
}

.drag-chosen {
  opacity: 0.9;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.loading-state p {
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

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.notes-page.can-reorder .notes-grid,
.notes-page.can-reorder .notes-list {
  cursor: grab;
}

.notes-page.can-reorder .notes-grid:active,
.notes-page.can-reorder .notes-list:active {
  cursor: grabbing;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drag-hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

.note-list-item {
  padding: 10px 16px 10px 50px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  min-height: 0;
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

.list-item-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.list-item-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.list-item-badges {
  display: flex;
  gap: 8px;
}

.badge-icon {
  color: var(--text-tertiary);
}

.badge-icon.pinned {
  color: var(--primary);
}

.badge-icon.favorite {
  color: var(--warning);
}

.badge-icon.protected {
  color: var(--text-tertiary);
}

.list-item-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.list-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.note-list-item:hover .list-item-actions {
  opacity: 1;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }

  .list-item-actions {
    opacity: 1;
  }
}
</style>