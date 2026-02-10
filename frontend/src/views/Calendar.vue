<template>
  <MainLayout>
    <div class="calendar-page">
      <div class="page-header">
        <h1 class="page-title">Календарь</h1>
        <p class="page-subtitle">События и регулярные платежи</p>
      </div>

      <div class="calendar-week-card card">
        <div class="section-header">
          <h2 class="section-title">Ближайшие 3 дня</h2>
          <button class="btn btn-sm btn-primary" @click="openCreateModal">
            Добавить событие
          </button>
        </div>

        <div v-if="upcomingLoading" class="loading-state">Загрузка...</div>
        <div v-else class="calendar-week">
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

      <div class="calendar-list card">
        <div class="section-header">
          <h2 class="section-title">События</h2>
          <span class="count" v-if="events.length">{{ events.length }}</span>
        </div>

        <div v-if="loading" class="loading-state">Загрузка...</div>
        <div v-else-if="!events.length" class="empty-state">
          <p>Пока нет событий</p>
        </div>
        <div v-else class="events-list">
          <div v-for="event in events" :key="event.id" class="event-row">
            <div class="event-info">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-meta">
                {{ formatDateTime(event.start_at) }}
                <span v-if="event.end_at">— {{ formatDateTime(event.end_at) }}</span>
                <span v-if="event.frequency !== 'none'" class="event-repeat">
                  • {{ repeatLabel(event) }}
                </span>
              </div>
            </div>
            <div class="event-actions">
              <button class="btn btn-icon-sm btn-ghost" @click="startEdit(event)">✎</button>
              <button class="btn btn-icon-sm btn-ghost" @click="removeEvent(event.id)">×</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal-card card">
          <h2 class="section-title">{{ editingId ? 'Редактировать событие' : 'Добавить событие' }}</h2>
          <div class="form-grid">
            <label class="field-block">
              <span class="field-label">Название события</span>
              <input v-model="form.title" class="input" type="text" placeholder="Например: Карманные деньги Саше" />
            </label>
            <label class="field-block">
              <span class="field-label">Начало (дата и время)</span>
              <input v-model="form.start_at" class="input" type="datetime-local" />
            </label>
            <label class="field-block">
              <span class="field-label">Конец (дата и время)</span>
              <input v-model="form.end_at" class="input" type="datetime-local" />
              <span class="field-hint">Необязательно. Для разового события можно не указывать.</span>
            </label>
            <label class="field-block">
              <span class="field-label">Повторение</span>
              <select v-model="form.frequency" class="input">
                <option value="none">Без повторения</option>
                <option value="daily">Каждый день</option>
                <option value="weekdays">Каждый будний день (Пн–Пт)</option>
                <option value="weekly">Каждую неделю</option>
                <option value="monthly">Каждый месяц</option>
                <option value="yearly">Каждый год</option>
              </select>
            </label>
            <label class="field-block" v-if="form.frequency !== 'none' && form.frequency !== 'weekdays'">
              <span class="field-label">Каждые N</span>
              <input
                v-model.number="form.interval_value"
                class="input"
                type="number"
                min="1"
                :placeholder="intervalPlaceholder"
              />
              <span class="field-hint">{{ intervalHint }}</span>
            </label>
            <label class="field-block field-block--wide">
              <span class="field-label">Описание</span>
              <input v-model="form.description" class="input" type="text" placeholder="Описание (опционально)" />
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveEvent" :disabled="saving">
              {{ editingId ? 'Сохранить' : 'Добавить' }}
            </button>
            <button class="btn btn-secondary" @click="closeModal">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import { calendarApi } from '@/services/api/calendar'
import { useUIStore } from '@/stores/ui'
import { CheckCircle, Circle } from 'lucide-vue-next'

const uiStore = useUIStore()
const events = ref([])
const upcoming = ref([])
const loading = ref(false)
const upcomingLoading = ref(false)
const saving = ref(false)
const editingId = ref(null)
const showModal = ref(false)

const form = ref({
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  frequency: 'none',
  interval_value: 1
})

const loadEvents = async () => {
  loading.value = true
  try {
    const res = await calendarApi.getAll()
    events.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    uiStore.showError('Ошибка загрузки календаря')
  } finally {
    loading.value = false
  }
}

const loadUpcoming = async () => {
  upcomingLoading.value = true
  try {
    const res = await calendarApi.getUpcoming(3)
    upcoming.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    uiStore.showError('Ошибка загрузки календаря')
  } finally {
    upcomingLoading.value = false
  }
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    frequency: 'none',
    interval_value: 1
  }
}

const openCreateModal = () => {
  resetForm()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const toDbDateTime = (val) => {
  if (!val) return null
  if (val.includes('T')) return `${val.replace('T', ' ')}:00`
  return val
}

const saveEvent = async () => {
  if (!form.value.title.trim() || !form.value.start_at) {
    uiStore.showError('Введите название и дату')
    return
  }
  saving.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || null,
      start_at: toDbDateTime(form.value.start_at),
      end_at: form.value.end_at ? toDbDateTime(form.value.end_at) : null,
      frequency: form.value.frequency,
      interval_value: form.value.frequency === 'none' ? 1 : form.value.interval_value
    }
    if (editingId.value) {
      await calendarApi.update(editingId.value, payload)
    } else {
      await calendarApi.create(payload)
    }
    await Promise.all([loadEvents(), loadUpcoming()])
    closeModal()
  } catch (e) {
    uiStore.showError('Ошибка сохранения события')
  } finally {
    saving.value = false
  }
}

const startEdit = (event) => {
  editingId.value = event.id
  form.value = {
    title: event.title || '',
    description: event.description || '',
    start_at: toInputDateTime(event.start_at),
    end_at: event.end_at ? toInputDateTime(event.end_at) : '',
    frequency: event.frequency || 'none',
    interval_value: event.interval_value || 1
  }
  showModal.value = true
}

const toInputDateTime = (val) => {
  if (!val) return ''
  const d = new Date(val)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const removeEvent = async (id) => {
  if (!confirm('Удалить событие?')) return
  try {
    await calendarApi.delete(id)
    events.value = events.value.filter(e => e.id !== id)
    await loadUpcoming()
  } catch (e) {
    uiStore.showError('Ошибка удаления события')
  }
}

const toggleCalendarDone = async (event) => {
  const occurrenceDate = event.occurrence_date || event.display_date
  if (!event?.source_event_id || !occurrenceDate) return
  const next = !event.is_completed
  event.is_completed = next
  try {
    await calendarApi.setOccurrenceComplete(event.source_event_id, occurrenceDate, next)
    await loadUpcoming()
  } catch (error) {
    event.is_completed = !next
    uiStore.showError('Ошибка обновления события')
  }
}

const formatDateTime = (val) => {
  if (!val) return ''
  const d = new Date(val)
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const intervalPlaceholder = computed(() => {
  const f = form.value.frequency
  if (f === 'daily') return '1'
  if (f === 'weekly') return '1'
  if (f === 'monthly') return '1'
  if (f === 'yearly') return '1'
  return '1'
})

const intervalHint = computed(() => {
  const f = form.value.frequency
  const n = form.value.interval_value || 1
  if (f === 'daily') return n === 1 ? 'Раз в день' : `каждые ${n} дня`
  if (f === 'weekly') return n === 1 ? 'Раз в неделю' : `каждые ${n} недели`
  if (f === 'monthly') return n === 1 ? 'Раз в месяц' : `каждые ${n} месяца`
  if (f === 'yearly') return n === 1 ? 'Раз в год' : `каждые ${n} года`
  return ''
})

const repeatLabel = (event) => {
  const interval = event.interval_value || 1
  if (event.frequency === 'daily') return interval === 1 ? 'каждый день' : `каждые ${interval} дня`
  if (event.frequency === 'weekdays') return 'каждый будний день'
  if (event.frequency === 'weekly') return interval === 1 ? 'каждую неделю' : `каждые ${interval} недели`
  if (event.frequency === 'monthly') return interval === 1 ? 'каждый месяц' : `каждые ${interval} месяца`
  if (event.frequency === 'yearly') return interval === 1 ? 'каждый год' : `каждые ${interval} года`
  return ''
}

const calendarWeek = computed(() => {
  const events = Array.isArray(upcoming.value) ? upcoming.value : []
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

onMounted(() => {
  loadEvents()
  loadUpcoming()
})
</script>

<style scoped>
.calendar-page {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  margin-bottom: 8px;
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

.calendar-week-card,
.calendar-list {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-block--wide {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.count {
  font-size: 12px;
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--text-secondary);
}

.loading-state,
.empty-state {
  padding: 16px 0;
  color: var(--text-tertiary);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.event-title {
  font-size: 14px;
  font-weight: 600;
}

.event-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

.event-repeat {
  color: var(--text-secondary);
}

.event-actions {
  display: flex;
  gap: 4px;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
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
  display: flex;
  align-items: center;
  gap: 10px;
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
  flex-shrink: 0;
}

.calendar-event-check:hover {
  color: var(--primary);
}

.calendar-event-time {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  flex-shrink: 0;
  min-width: 48px;
}

.calendar-event-title {
  font-size: 13px;
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

.calendar-event-empty {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 12px;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2000;
}

.modal-card {
  width: min(640px, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 16px;
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

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
