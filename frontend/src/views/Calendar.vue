<template>
  <MainLayout>
    <div class="calendar-page">
      <div class="page-header">
        <h1 class="page-title">Календарь</h1>
        <p class="page-subtitle">События и регулярные платежи</p>
      </div>

      <div class="calendar-card card">
        <h2 class="section-title">Добавить событие</h2>
        <div class="form-grid">
          <input v-model="form.title" class="input" type="text" placeholder="Название" />
          <input v-model="form.start_at" class="input" type="datetime-local" />
          <input v-model="form.end_at" class="input" type="datetime-local" />
          <select v-model="form.frequency" class="input">
            <option value="none">Без повторения</option>
            <option value="weekly">Каждую неделю</option>
            <option value="monthly">Каждый месяц</option>
            <option value="yearly">Каждый год</option>
          </select>
          <input
            v-model.number="form.interval_value"
            class="input"
            type="number"
            min="1"
            :disabled="form.frequency === 'none'"
            placeholder="Интервал"
          />
          <input v-model="form.description" class="input" type="text" placeholder="Описание (опционально)" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveEvent" :disabled="saving">
            {{ editingId ? 'Сохранить' : 'Добавить' }}
          </button>
          <button v-if="editingId" class="btn btn-secondary" @click="resetForm">Отмена</button>
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
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import { calendarApi } from '@/services/api/calendar'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const events = ref([])
const loading = ref(false)
const saving = ref(false)
const editingId = ref(null)

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
    await loadEvents()
    resetForm()
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
  } catch (e) {
    uiStore.showError('Ошибка удаления события')
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

const repeatLabel = (event) => {
  const interval = event.interval_value || 1
  if (event.frequency === 'weekly') return interval === 1 ? 'каждую неделю' : `каждые ${interval} недели`
  if (event.frequency === 'monthly') return interval === 1 ? 'каждый месяц' : `каждые ${interval} месяца`
  if (event.frequency === 'yearly') return interval === 1 ? 'каждый год' : `каждые ${interval} года`
  return ''
}

onMounted(loadEvents)
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

.calendar-card,
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
  gap: 10px;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
