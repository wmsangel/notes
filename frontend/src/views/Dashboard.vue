<!-- frontend/src/views/Dashboard.vue -->
<template>
  <MainLayout>
    <div class="dashboard">
      <div class="dashboard-header">
        <h1 class="page-title">Главная</h1>
        <p class="page-subtitle">Добро пожаловать в вашу систему заметок</p>
      </div>

      <div class="dashboard-grid">
        <!-- Задачи на главной -->
        <div
          v-if="(stats.todos?.tasks_on_dashboard || []).length > 0"
          class="dashboard-section card tasks-today wide"
        >
          <div class="section-header">
            <h2 class="section-title">
              <Calendar :size="20" />
              Задачи на главной
            </h2>
            <router-link to="/todos-overview" class="btn btn-sm btn-ghost">
              Все задачи
              <ArrowRight :size="16" />
            </router-link>
          </div>
          <div class="notes-list">
            <router-link
              v-for="task in stats.todos.tasks_on_dashboard"
              :key="task.id"
              :to="task.folder_id ? `/folder/${task.folder_id}` : `/todos/${task.list_id}`"
              class="note-item task-item"
              :class="{ completed: task.is_completed }"
            >
              <button
                class="task-toggle"
                :class="{ done: task.is_completed }"
                type="button"
                @click.stop="toggleTask(task)"
                :disabled="togglingTasks[task.id]"
                title="Закрыть/открыть задачу"
              >
                <CheckCircle v-if="task.is_completed" :size="18" />
                <Circle v-else :size="18" />
              </button>
              <div class="note-info">
                <div class="note-title">{{ task.title }}</div>
                <div class="note-meta">
                  {{ task.list_title }}
                  <span v-if="task.folder_name" class="folder-badge">{{ task.folder_name }}</span>
                </div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>
          </div>
        </div>

        <!-- Календарь (ближайшие 7 дней) -->
        <div
          v-if="(stats.calendar_upcoming || []).length > 0"
          class="dashboard-section card wide"
        >
          <div class="section-header">
            <h2 class="section-title">
              <Calendar :size="20" />
              Календарь (7 дней)
            </h2>
            <router-link to="/calendar" class="btn btn-sm btn-ghost">
              Открыть
              <ArrowRight :size="16" />
            </router-link>
          </div>
          <div class="calendar-week">
            <div
              v-for="day in calendarWeek"
              :key="day.key"
              class="calendar-day"
              :class="{ today: day.isToday }"
            >
              <div class="calendar-day-header">
                <div class="calendar-day-title">{{ formatDayLabel(day.date) }}</div>
                <span v-if="day.isToday" class="today-badge">Сегодня</span>
              </div>
              <div class="calendar-day-events">
                <div
                  v-for="event in day.events"
                  :key="`${event.source_event_id}-${event.start_at}`"
                  class="calendar-event"
                  :class="{
                    'is-completed': event.is_completed,
                    'is-overdue': event.is_overdue
                  }"
                >
                  <button
                    class="calendar-event-check"
                    type="button"
                    @click="toggleCalendarDone(event)"
                    :title="event.is_completed ? 'Снять отметку' : 'Отметить выполненным'"
                  >
                    <CheckCircle v-if="event.is_completed" :size="16" />
                    <Circle v-else :size="16" />
                  </button>
                  <div class="calendar-event-time">{{ formatEventTime(event.start_at) }}</div>
                  <div class="calendar-event-title">
                    {{ event.title }}
                    <span v-if="event.is_overdue" class="overdue-badge">Просрочено</span>
                  </div>
                </div>
                <div v-if="!day.events.length" class="calendar-event-empty">Нет событий</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Заметки на главной -->
        <div
            v-if="(stats.dashboard_notes || []).length > 0"
            class="dashboard-section card"
        >
          <div class="section-header">
            <h2 class="section-title">
              <Pin :size="20" />
              На главной
            </h2>
            <router-link to="/notes" class="btn btn-sm btn-ghost">
              Все заметки
              <ArrowRight :size="16" />
            </router-link>
          </div>
          <div class="notes-list">
            <router-link
                v-for="note in stats.dashboard_notes"
                :key="note.id"
                :to="`/notes/${note.id}`"
                class="note-item"
                :style="note.color ? { borderLeft: `1px solid ${note.color}` } : null"
            >
              <div class="note-info">
                <div class="note-title">{{ note.title }}</div>
                <div v-if="note.folder_name" class="note-folder">{{ note.folder_name }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>
          </div>
        </div>

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
                v-for="note in stats.notes?.recent || []"
                :key="note.id"
                :to="`/notes/${note.id}`"
                class="note-item"
                :style="note.color ? { borderLeft: `1px solid ${note.color}` } : null"
            >
              <div class="note-info">
                <div class="note-title">{{ note.title }}</div>
                <div v-if="note.folder_name" class="note-folder">{{ note.folder_name }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>
            <div v-if="!(stats.notes?.recent?.length)" class="empty-state">
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
                v-for="note in stats.favorites || []"
                :key="note.id"
                :to="`/notes/${note.id}`"
                class="note-item"
                :style="note.color ? { borderLeft: `1px solid ${note.color}` } : null"
            >
              <div class="note-info">
                <div class="note-title">{{ note.title }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>
            <div v-if="!(stats.favorites?.length)" class="empty-state">
              <Star :size="32" class="empty-icon" />
              <p>Нет избранных заметок</p>
            </div>
          </div>
        </div>

        <!-- TODO списки -->
        <div v-if="(stats.todos?.lists || []).length > 0" class="dashboard-section card wide">
          <div class="section-header">
            <h2 class="section-title">
              <ListTodo :size="20" />
              Списки задач
            </h2>
            <router-link to="/todos" class="btn btn-sm btn-ghost">
              Все списки
              <ArrowRight :size="16" />
            </router-link>
          </div>
          <div class="notes-list">
            <router-link
              v-for="list in stats.todos.lists"
              :key="list.id"
              :to="`/todos/${list.id}`"
              class="note-item"
            >
              <div class="note-info">
                <div class="note-title">{{ list.title }}</div>
                <div v-if="list.folder_name" class="note-folder">{{ list.folder_name }}</div>
              </div>
              <ChevronRight :size="16" class="note-arrow" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Быстрый доступ к папкам -->
      <div v-if="(stats.folders?.list || []).length > 0" class="folder-quick-access card">
        <h2 class="section-title">
          <Folder :size="20" />
          Папки
        </h2>
        <div class="folder-chips">
          <router-link
              v-for="f in rootFoldersForDashboard"
              :key="f.id"
              :to="`/folder/${f.id}`"
              class="folder-chip"
          >
            <Folder :size="16" />
            {{ f.name }}
          </router-link>
        </div>
      </div>

      <!-- Быстрые ссылки на проекты -->
      <div class="project-links card">
        <div class="section-header">
          <h2 class="section-title">
            <Link2 :size="20" />
            Проекты
          </h2>
          <button class="btn btn-sm btn-primary" @click="openAddProjectModal">
            Добавить проект
          </button>
        </div>

        <div class="project-links-list" v-if="projectLinks.length">
          <a
            v-for="link in projectLinks"
            :key="link.id"
            class="project-link"
            :href="link.url"
            target="_blank"
            rel="noopener"
          >
            <img
              class="project-link-icon"
              :src="link.icon_url || getFavicon(link.url)"
              alt=""
              loading="lazy"
            />
            <span class="project-link-title">{{ link.title }}</span>
            <button
              class="btn btn-icon-sm btn-ghost project-link-remove"
              type="button"
              @click.prevent="deleteLink(link.id)"
              title="Удалить ссылку"
            >
              ×
            </button>
          </a>
        </div>
        <div v-else class="empty-state">
          <p>Пока нет ссылок</p>
          <button class="btn btn-sm btn-ghost" @click="openAddProjectModal">
            Добавить первый проект
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useTodosStore } from '@/stores/todos'
import { useUIStore } from '@/stores/ui'
import { dashboardApi } from '@/services/api/dashboard'
import { calendarApi } from '@/services/api/calendar'
import MainLayout from '@/components/layout/MainLayout.vue'
import ProjectLinkModal from '@/components/features/ProjectLinkModal.vue'
import {
  FileText,
  Star,
  CheckCircle,
  Circle,
  Folder,
  Clock,
  ArrowRight,
  ChevronRight,
  Calendar,
  Pin,
  ListTodo,
  Link2
} from 'lucide-vue-next'

const dashboardStore = useDashboardStore()
const todosStore = useTodosStore()
const uiStore = useUIStore()

const stats = computed(() => dashboardStore.stats)
const togglingTasks = reactive({})
const projectLinks = ref([])

const openAddProjectModal = () => {
  uiStore.openModal(ProjectLinkModal, {
    onCreated: (link) => {
      projectLinks.value = [link, ...projectLinks.value]
    }
  })
}

const rootFoldersForDashboard = computed(() => {
  const list = stats.value?.folders?.list || []
  return list.filter((f) => f.parent_id == null)
})

const calendarWeek = computed(() => {
  const events = Array.isArray(stats.value?.calendar_upcoming) ? stats.value.calendar_upcoming : []
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const dayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d)
    return { key, date: d, isToday: i === 0, events: [] }
  })

  const map = new Map(days.map((d) => [d.key, d]))
  for (const event of events) {
    const key = event.display_date
      ? event.display_date
      : (() => {
          if (!event?.start_at) return null
          const d = new Date(event.start_at)
          if (Number.isNaN(d.getTime())) return null
          return dayKey(d)
        })()
    if (!key) continue
    const bucket = map.get(key)
    if (bucket) bucket.events.push(event)
  }

  for (const day of days) {
    day.events.sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
  }

  return days
})

onMounted(() => {
  dashboardStore.fetchStats()
})

watch(stats, (val) => {
  projectLinks.value = Array.isArray(val?.project_links) ? [...val.project_links] : []
}, { immediate: true })

const toggleTask = async (task) => {
  if (!task?.id || togglingTasks[task.id]) return
  togglingTasks[task.id] = true
  try {
    await todosStore.toggleItem(task.id)
    await dashboardStore.fetchStats()
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  } finally {
    setTimeout(() => {
      togglingTasks[task.id] = false
    }, 300)
  }
}

const toggleCalendarDone = async (event) => {
  const occurrenceDate = event.occurrence_date || event.display_date
  if (!event?.source_event_id || !occurrenceDate) return
  const next = !event.is_completed
  event.is_completed = next
  try {
    await calendarApi.setOccurrenceComplete(event.source_event_id, occurrenceDate, next)
    await dashboardStore.fetchStats()
  } catch (error) {
    event.is_completed = !next
    uiStore.showError('Ошибка обновления события')
  }
}

const getFavicon = (url) => {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`
  } catch {
    return ''
  }
}

const deleteLink = async (id) => {
  if (!confirm('Удалить ссылку?')) return
  try {
    await dashboardApi.deleteLink(id)
    projectLinks.value = projectLinks.value.filter(l => l.id !== id)
  } catch (error) {
    uiStore.showError('Ошибка удаления ссылки')
  }
}

const formatEventDate = (val) => {
  if (!val) return ''
  const d = new Date(val)
  const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date} • ${time}`
}

const formatDayLabel = (date) => {
  if (!date) return ''
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
}

const formatEventTime = (val) => {
  if (!val) return ''
  if (typeof val === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(val.trim())) return 'Весь день'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.dashboard-section.wide {
  grid-column: 1 / -1;
}

.dashboard-section.wide .section-header {
  padding: 14px 18px;
}

.dashboard-section.wide .notes-list {
  padding: 10px;
}

.dashboard-section.wide .note-item {
  padding: 14px 14px;
}

.dashboard-section.wide .note-title {
  font-size: 14px;
}

.dashboard-section.wide .note-folder,
.dashboard-section.wide .note-meta {
  font-size: 12px;
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

.note-folder,
.note-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.task-toggle {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.task-toggle:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--success);
}

.task-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-toggle.done {
  color: var(--success);
}

.task-item.completed .note-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.folder-badge {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  font-size: 10px;
  color: var(--text-secondary);
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

.folder-quick-access {
  margin-top: 24px;
  padding: 16px;
  border-radius: var(--radius-lg);
}

.folder-quick-access .section-title {
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.folder-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.folder-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius);
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  color: var(--text);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
}

.folder-chip:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.calendar-week {
  padding: 12px 12px 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.calendar-day {
  background: var(--bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.calendar-day.today {
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary-soft);
}

.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.calendar-day-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  text-transform: capitalize;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-day-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendar-event {
  display: grid;
  grid-template-columns: 22px 1fr;
  grid-auto-rows: auto;
  gap: 6px 8px;
  align-items: start;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  width: 100%;
  min-width: 0;
}

.calendar-event-check {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.calendar-event-check:hover {
  color: var(--primary);
}

.calendar-event-empty {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 12px;
}

.calendar-event-time {
  grid-column: 2;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
}

.calendar-event-title {
  grid-column: 2;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.calendar-event.is-completed .calendar-event-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.calendar-event.is-overdue {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.08);
}

.overdue-badge {
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  font-size: 10px;
  font-weight: 600;
}

.today-badge {
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .calendar-week {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(220px, 1fr);
    overflow-x: auto;
    padding-bottom: 10px;
  }
  .calendar-week::-webkit-scrollbar {
    height: 6px;
  }
  .calendar-week::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 999px;
  }
}

.project-links {
  margin-top: 24px;
  padding: 16px;
  border-radius: var(--radius-lg);
}

.project-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.project-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  transition: var(--transition);
}

.project-link:hover {
  background: var(--bg-tertiary);
  border-color: var(--border);
}

.project-link-icon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.project-link-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-link-remove {
  color: var(--text-tertiary);
}

@media (min-width: 769px) {
  .folder-quick-access {
    display: none;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 22px;
  }
}
</style>
