<!-- frontend/src/views/Dashboard.vue -->
<template>
  <MainLayout>
    <div class="dashboard">
      <div class="dashboard-header">
        <h1 class="page-title">Главная</h1>
        <p class="page-subtitle">Добро пожаловать в вашу систему заметок</p>
      </div>

      <div class="dashboard-grid">
        <!-- 1. Календарь -->
        <div class="dashboard-section card wide">
          <div class="section-header">
            <h2 class="section-title">
              <Calendar :size="20" />
              Календарь (3 дня)
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

        <!-- 2. Задачи (аккордеон) -->
        <div class="dashboard-section card wide">
          <div class="section-header">
            <h2 class="section-title">
              <ListTodo :size="20" />
              Задачи
            </h2>
            <router-link to="/todos-overview" class="btn btn-sm btn-ghost">
              Все задачи
              <ArrowRight :size="16" />
            </router-link>
          </div>
          <div v-if="todoOverviewLoading" class="empty-state">
            <p>Загрузка задач...</p>
          </div>
          <div v-else-if="!todoOverview.length" class="empty-state">
            <p>Нет активных задач</p>
          </div>
          <div v-else class="todo-accordion">
            <div v-for="list in todoOverview" :key="list.id" class="todo-group">
              <button class="todo-group-head" type="button" @click="toggleTodoGroup(list.id)">
                <div class="todo-group-meta">
                  <div class="todo-group-title">{{ list.title }}</div>
                  <div class="todo-group-sub" v-if="list.folder_name">{{ list.folder_name }}</div>
                </div>
                <div class="todo-group-right">
                  <span class="todo-group-count">{{ list.items.length }}</span>
                  <ChevronDown :size="16" :class="{ 'todo-group-icon-open': isTodoGroupOpen(list.id) }" />
                </div>
              </button>
              <div v-if="isTodoGroupOpen(list.id)" class="todo-group-body">
                <div class="todo-group-items" v-if="list.items.length">
                  <TodoItem
                    v-for="item in list.items"
                    :key="item.id"
                    :item="item"
                    @toggle="(id) => toggleTodoItem(list.id, id)"
                    @update="(id, data) => updateTodoItem(list.id, id, data)"
                    @delete="(id) => deleteTodoItem(list.id, id)"
                  />
                </div>
                <div v-else class="todo-group-empty">Нет задач в списке</div>
                <div class="todo-group-add">
                  <input
                    v-model="newTodoTitles[list.id]"
                    class="input"
                    type="text"
                    :placeholder="`Добавить задачу в «${list.title}»`"
                    @keydown.enter="addTodoItem(list.id)"
                  />
                  <button class="btn btn-primary" @click="addTodoItem(list.id)">Добавить</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Проекты -->
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

        <!-- 4. Недавние заметки -->
        <div class="dashboard-section card wide">
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

        <!-- 5. Избранное -->
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
import * as todosApi from '@/services/api/todos'
import MainLayout from '@/components/layout/MainLayout.vue'
import ProjectLinkModal from '@/components/features/ProjectLinkModal.vue'
import TodoItem from '@/components/features/TodoItem.vue'
import {
  FileText,
  Star,
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Calendar,
  ListTodo,
  Link2
} from 'lucide-vue-next'

const dashboardStore = useDashboardStore()
const todosStore = useTodosStore()
const uiStore = useUIStore()

const stats = computed(() => dashboardStore.stats)
const projectLinks = ref([])
const todoOverviewLoading = ref(false)
const todoOverview = ref([])
const openTodoGroups = reactive({})
const newTodoTitles = reactive({})

const openAddProjectModal = () => {
  uiStore.openModal(ProjectLinkModal, {
    onCreated: (link) => {
      projectLinks.value = [link, ...projectLinks.value]
    }
  })
}

const calendarWeek = computed(() => {
  const events = Array.isArray(stats.value?.calendar_upcoming) ? stats.value.calendar_upcoming : []
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const dayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const days = Array.from({ length: 3 }, (_, i) => {
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

const loadTodoOverview = async () => {
  todoOverviewLoading.value = true
  try {
    const data = await todosApi.getOverview({ include_completed: 0 })
    todoOverview.value = Array.isArray(data) ? data : []
    for (const list of todoOverview.value) {
      if (openTodoGroups[list.id] === undefined) openTodoGroups[list.id] = true
      if (newTodoTitles[list.id] === undefined) newTodoTitles[list.id] = ''
    }
  } catch (error) {
    uiStore.showError('Ошибка загрузки задач')
  } finally {
    todoOverviewLoading.value = false
  }
}

onMounted(() => {
  dashboardStore.fetchStats()
  loadTodoOverview()
})

watch(stats, (val) => {
  projectLinks.value = Array.isArray(val?.project_links) ? [...val.project_links] : []
}, { immediate: true })

const isTodoGroupOpen = (listId) => !!openTodoGroups[listId]

const toggleTodoGroup = (listId) => {
  openTodoGroups[listId] = !openTodoGroups[listId]
}

const addTodoItem = async (listId) => {
  const title = (newTodoTitles[listId] || '').trim()
  if (!title) return
  try {
    const item = await todosStore.createItem({ list_id: listId, title, priority: 'medium' })
    const list = todoOverview.value.find((l) => l.id === listId)
    if (list) list.items.push(item)
    newTodoTitles[listId] = ''
  } catch (error) {
    uiStore.showError('Ошибка добавления задачи')
  }
}

const toggleTodoItem = async (listId, itemId) => {
  try {
    const updated = await todosStore.toggleItem(itemId)
    const list = todoOverview.value.find((l) => l.id === listId)
    if (!list) return
    if (updated.is_completed) {
      list.items = list.items.filter((i) => i.id !== itemId)
      return
    }
    const idx = list.items.findIndex((i) => i.id === itemId)
    if (idx !== -1) list.items[idx] = updated
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const updateTodoItem = async (listId, itemId, data) => {
  try {
    const updated = await todosStore.updateItem(itemId, data)
    const list = todoOverview.value.find((l) => l.id === listId)
    if (!list) return
    const idx = list.items.findIndex((i) => i.id === itemId)
    if (idx !== -1) list.items[idx] = updated
  } catch (error) {
    uiStore.showError('Ошибка обновления задачи')
  }
}

const deleteTodoItem = async (listId, itemId) => {
  try {
    await todosStore.deleteItem(itemId)
    const list = todoOverview.value.find((l) => l.id === listId)
    if (!list) return
    list.items = list.items.filter((i) => i.id !== itemId)
  } catch (error) {
    uiStore.showError('Ошибка удаления задачи')
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

.todo-accordion {
  display: flex;
  flex-direction: column;
  padding: 8px 10px 12px;
  gap: 10px;
}

.todo-group {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  overflow: hidden;
}

.todo-group-head {
  width: 100%;
  border: none;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
}

.todo-group-head:hover {
  background: var(--surface-raised);
}

.todo-group-meta {
  min-width: 0;
}

.todo-group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-group-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.todo-group-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.todo-group-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.todo-group-icon-open {
  transform: rotate(180deg);
}

.todo-group-body {
  border-top: 1px solid var(--border-subtle);
}

.todo-group-items :deep(.todo-item) {
  padding: 12px 14px;
}

.todo-group-add {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-subtle);
}

.todo-group-empty {
  padding: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
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
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
  min-height: 160px;
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
  font-size: 15px;
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
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
  flex-shrink: 0;
}

.calendar-event-check:hover {
  color: var(--primary);
}

.calendar-event-empty {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 13px;
}

.calendar-event-time {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  flex-shrink: 0;
  min-width: 56px;
}

.calendar-event-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  margin-top: 0;
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

  .todo-group-add {
    flex-direction: column;
  }
}
</style>
