<!-- frontend/src/views/Dashboard.vue -->
<template>
  <MainLayout>
    <div class="dashboard">
      <div class="dashboard-header">
        <h1 class="page-title">Главная</h1>
        <p class="page-subtitle">Добро пожаловать в вашу систему заметок</p>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card card">
          <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--primary);">
            <FileText :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.notes.total }}</div>
            <div class="stat-label">Всего заметок</div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
            <Star :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.favorites.length }}</div>
            <div class="stat-label">Избранное</div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
            <CheckCircle :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.todos.completed }}/{{ stats.todos.total }}</div>
            <div class="stat-label">Задачи выполнены</div>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon" style="background: var(--primary-soft); color: var(--accent);">
            <Folder :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.folders.total }}</div>
            <div class="stat-label">Папок</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Недавние заметки -->
        <div class="dashboard-section card">
          <div class="section-header">
            <h2 class="section-title">
              <Clock :size="20" />
              Недавние заметки
            </h2>
            <router-link to="/notes" class="btn btn-sm btn-ghost">
              Все заметки
              <ArrowRight :size="16" />
            </router-link>
          </div>

          <div class="notes-list">
            <router-link
                v-for="note in stats.notes.recent"
                :key="note.id"
                :to="`/notes/${note.id}`"
                class="note-item"
            >
              <div class="note-info">
                <div class="note-title">{{ note.title }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>

            <div v-if="!stats.notes.recent.length" class="empty-state">
              <FileText :size="32" class="empty-icon" />
              <p>Пока нет заметок</p>
            </div>
          </div>
        </div>

        <!-- Избранное -->
        <div class="dashboard-section card">
          <div class="section-header">
            <h2 class="section-title">
              <Star :size="20" />
              Избранное
            </h2>
            <router-link to="/favorites" class="btn btn-sm btn-ghost">
              Все избранные
              <ArrowRight :size="16" />
            </router-link>
          </div>

          <div class="notes-list">
            <router-link
                v-for="note in stats.favorites"
                :key="note.id"
                :to="`/notes/${note.id}`"
                class="note-item"
            >
              <div class="note-info">
                <div class="note-title">{{ note.title }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>

            <div v-if="!stats.favorites.length" class="empty-state">
              <Star :size="32" class="empty-icon" />
              <p>Нет избранных заметок</p>
            </div>
          </div>
        </div>

        <!-- Быстрые действия -->
        <div class="dashboard-section card quick-actions">
          <div class="section-header">
            <h2 class="section-title">
              <Zap :size="20" />
              Быстрые действия
            </h2>
          </div>

          <div class="actions-grid">
            <button class="action-btn" @click="createNote">
              <Plus :size="20" />
              <span>Новая заметка</span>
            </button>

            <button class="action-btn" @click="createTodo">
              <CheckSquare :size="20" />
              <span>TODO лист</span>
            </button>

            <button class="action-btn" @click="createFolder">
              <FolderPlus :size="20" />
              <span>Новая папка</span>
            </button>

            <router-link to="/search" class="action-btn">
              <Search :size="20" />
              <span>Поиск</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import { useNotesStore } from '@/stores/notes'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import FolderModal from '@/components/features/FolderModal.vue'
import {
  FileText,
  Star,
  CheckCircle,
  Folder,
  Clock,
  ArrowRight,
  ChevronRight,
  Zap,
  Plus,
  CheckSquare,
  FolderPlus,
  Search
} from 'lucide-vue-next'

const router = useRouter()
const dashboardStore = useDashboardStore()
const notesStore = useNotesStore()
const uiStore = useUIStore()

const stats = computed(() => dashboardStore.stats)

onMounted(() => {
  dashboardStore.fetchStats()
})

const createNote = async () => {
  try {
    const note = await notesStore.createNote({
      title: '',
      content: '',
      folder_id: null
    })
    router.push(`/notes/${note.id}`)
  } catch (error) {
    uiStore.showError('Ошибка при создании заметки')
  }
}

const createTodo = () => {
  router.push('/todos')
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('create-todo-list'))
  }, 100)
}

const createFolder = () => {
  uiStore.openModal(FolderModal)
}
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: var(--radius);
  transition: var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.dashboard-section {
  padding: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notes-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.note-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text);
  transition: var(--transition);
}

.note-item:hover {
  background: var(--surface-raised);
}

.note-info {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.note-arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.empty-state {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  margin: 0 auto 10px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.actions-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
}

.action-btn:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
  box-shadow: var(--shadow-subtle);
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 22px;
  }
}
</style>