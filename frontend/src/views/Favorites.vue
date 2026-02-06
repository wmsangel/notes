<!-- frontend/src/views/Favorites.vue -->
<template>
  <MainLayout>
    <div class="favorites-page">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <Star :size="32" />
            Избранное
          </h1>
          <span class="notes-count">{{ favoriteNotes.length }}</span>
        </div>

        <div class="header-right" v-if="favoriteNotes.length">
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
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка...</p>
      </div>

      <div v-else-if="!favoriteNotes.length" class="empty-state">
        <Star :size="64" class="empty-icon" />
        <h2>Нет избранных заметок</h2>
        <p>Добавьте заметки в избранное, чтобы быстро находить их</p>
        <router-link to="/notes" class="btn btn-primary">
          <FileText :size="18" />
          Все заметки
        </router-link>
      </div>

      <template v-else>
        <div v-if="viewMode === 'grid'" class="notes-grid">
          <NoteCard
              v-for="note in favoriteNotes"
              :key="note.id"
              :note="note"
              @delete="handleDelete"
          />
        </div>
        <div v-else class="notes-list">
          <div
              v-for="note in favoriteNotes"
              :key="note.id"
              class="note-list-item card card-hover"
              :style="note.color ? { borderLeft: `1px solid ${note.color}` } : null"
              @click="$router.push(`/notes/${note.id}`)"
          >
            <div class="list-item-content">
              <div class="list-item-header">
                <h3 class="list-item-title">{{ note.title }}</h3>
                <div class="list-item-badges">
                  <Pin v-if="note.is_pinned" :size="14" class="badge-icon pinned" />
                  <Star :size="14" class="badge-icon favorite" fill="currentColor" />
                </div>
              </div>
              <p class="list-item-preview" v-if="getContentPreview(note)">{{ getContentPreview(note) }}</p>
              <div class="list-item-footer">
                <div class="list-item-actions" @click.stop>
                  <button class="btn btn-icon-sm btn-ghost" @click="toggleFavorite(note.id)" title="Убрать из избранного">
                    <Star :size="16" fill="currentColor" />
                  </button>
                  <button class="btn btn-icon-sm btn-ghost" @click="handleDelete(note.id)" title="Удалить">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { useUIStore } from '@/stores/ui'
import { useDashboardStore } from '@/stores/dashboard'
import MainLayout from '@/components/layout/MainLayout.vue'
import NoteCard from '@/components/features/NoteCard.vue'
import { Star, FileText, Grid, List, Pin, Trash2 } from 'lucide-vue-next'

const notesStore = useNotesStore()
const uiStore = useUIStore()
const dashboardStore = useDashboardStore()

const loading = ref(false)
const viewMode = ref('grid')
const favoriteNotesList = ref([])

const favoriteNotes = computed(() => favoriteNotesList.value)

onMounted(async () => {
  loading.value = true
  favoriteNotesList.value = []
  try {
    await notesStore.fetchNotes({ is_favorite: 1 })
    favoriteNotesList.value = Array.isArray(notesStore.notes) ? [...notesStore.notes] : []
  } catch (error) {
    uiStore.showError('Ошибка загрузки избранных заметок')
  } finally {
    loading.value = false
  }
})

const handleDelete = async (noteId) => {
  if (!confirm('Удалить заметку из избранного?')) return

  try {
    await notesStore.deleteNote(noteId)
    favoriteNotesList.value = favoriteNotesList.value.filter(n => n.id !== noteId)
    dashboardStore.fetchStats()
    uiStore.showSuccess('Заметка удалена')
  } catch (error) {
    uiStore.showError('Ошибка при удалении')
  }
}

const getContentPreview = (note) => {
  if (!note?.content) return ''
  const text = note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 120) + (text.length > 120 ? '…' : '')
}

const toggleFavorite = async (noteId) => {
  try {
    await notesStore.updateNote(noteId, { is_favorite: false })
    favoriteNotesList.value = favoriteNotesList.value.filter(n => n.id !== noteId)
    dashboardStore.fetchStats()
    uiStore.showSuccess('Убрано из избранного')
  } catch (error) {
    uiStore.showError('Ошибка обновления')
  }
}
</script>

<style scoped>
.favorites-page {
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

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title svg {
  color: var(--warning);
}

.notes-count {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
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
  color: var(--warning);
  opacity: 0.3;
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

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-list-item {
  padding: 20px;
  cursor: pointer;
  transition: var(--transition);
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
  .notes-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
