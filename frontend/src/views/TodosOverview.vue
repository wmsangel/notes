<template>
  <MainLayout>
    <div class="todos-overview-page">
      <div class="page-header">
        <h1 class="page-title">Все задачи</h1>
        <p class="page-subtitle">Обзор всех списков и задач</p>
      </div>

      <div v-if="loading" class="loading-state">
        <Loader :size="32" class="spinner" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="!lists.length" class="empty-state">
        <ListTodo :size="64" class="empty-icon" />
        <h2 class="empty-title">Нет задач</h2>
        <p class="empty-text">Создайте хотя бы один список задач, чтобы видеть обзор.</p>
        <router-link to="/todos" class="btn btn-primary">
          <Plus :size="18" />
          Перейти к спискам
        </router-link>
      </div>

      <div v-else class="overview-groups">
        <section
            v-for="list in lists"
            :key="list.id"
            class="overview-group card"
        >
          <header class="group-header">
            <div class="group-title-block">
              <h2 class="group-title" :style="{ color: list.color || undefined }">
                {{ list.title }}
              </h2>
              <div v-if="list.folder_name" class="group-folder">
                {{ list.folder_name }}
              </div>
            </div>
            <router-link :to="`/todos/${list.id}`" class="group-link">
              Открыть список
              <ChevronRight :size="16" />
            </router-link>
          </header>

          <div v-if="pendingItems(list).length" class="group-items">
            <div
                v-for="item in pendingItems(list)"
                :key="item.id"
                class="task-row"
                @click="openList(list.id)"
            >
              <div class="task-left">
                <Circle :size="18" class="task-check" />
                <div class="task-text">
                  <div class="task-title">{{ item.title }}</div>
                  <div v-if="item.due_date" class="task-meta">
                    {{ formatDueDate(item.due_date) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="group-empty">
            <span>Нет задач в работе</span>
          </div>

          <button
              v-if="completedItems(list).length"
              class="toggle-completed"
              @click="toggleCompleted(list.id)"
          >
            <ChevronDown
                :size="14"
                class="chevron"
                :class="{ 'chevron--collapsed': !expandedCompleted[list.id] }"
            />
            <span>Выполнено: {{ completedItems(list).length }}</span>
          </button>

          <div
              v-if="completedItems(list).length && expandedCompleted[list.id]"
              class="group-items completed"
          >
            <div
                v-for="item in completedItems(list)"
                :key="item.id"
                class="task-row completed"
                @click="openList(list.id)"
            >
              <div class="task-left">
                <CheckCircle :size="18" class="task-check done" />
                <div class="task-text">
                  <div class="task-title">{{ item.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as todosApi from '@/services/api/todos'
import MainLayout from '@/components/layout/MainLayout.vue'
import { ListTodo, Loader, Plus, ChevronRight, Circle, CheckCircle, ChevronDown } from 'lucide-vue-next'
const router = useRouter()

const loading = ref(true)
const lists = ref([])
const expandedCompleted = ref({})

onMounted(async () => {
  loading.value = true
  try {
    const data = await todosApi.getOverview()
    lists.value = data
  } finally {
    loading.value = false
  }
})

const pendingItems = (list) => {
  return (list.items || []).filter(i => !i.is_completed)
}

const completedItems = (list) => {
  return (list.items || []).filter(i => i.is_completed)
}

const toggleCompleted = (listId) => {
  expandedCompleted.value[listId] = !expandedCompleted.value[listId]
}

const openList = (listId) => {
  router.push(`/todos/${listId}`)
}

const formatDueDate = (val) => {
  if (!val) return ''
  const d = new Date(val)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.todos-overview-page {
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-secondary);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  background: var(--bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
}

.empty-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  max-width: 360px;
}

.overview-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-group {
  padding: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.group-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.group-folder {
  font-size: 12px;
  color: var(--text-tertiary);
}

.group-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
}

.group-link:hover {
  color: var(--primary);
}

.group-items {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-items.completed {
  border-top: 1px dashed var(--border-subtle);
  padding-top: 6px;
}

.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.task-row:hover {
  background: var(--surface-raised);
}

.task-row.completed {
  opacity: 0.7;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-check {
  color: var(--text-tertiary);
}

.task-check.done {
  color: var(--success);
}

.task-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-size: 14px;
  color: var(--text);
}

.task-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

.group-empty {
  padding: 10px 12px 12px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.toggle-completed {
  width: 100%;
  border: none;
  background: transparent;
  border-top: 1px solid var(--border-subtle);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.toggle-completed:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.chevron {
  transition: transform 0.2s var(--ease);
}

.chevron--collapsed {
  transform: rotate(-90deg);
}

@media (max-width: 768px) {
  .todos-overview-page {
    max-width: 100%;
  }
}
</style>

