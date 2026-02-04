<!-- frontend/src/components/features/TodoListCard.vue -->
<template>
  <div class="todo-list-card card card-hover" @click="openList">
    <div class="card-header">
      <h3 class="card-title">{{ list.title }}</h3>

      <div class="card-actions" @click.stop>
        <button
            class="btn btn-icon-sm btn-ghost"
            @click="$emit('edit', list)"
            title="Редактировать"
        >
          <Edit2 :size="16" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click="deleteList"
            title="Удалить"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <p class="card-description" v-if="list.description">
      {{ list.description }}
    </p>

    <div class="card-stats">
      <div class="stat">
        <CheckCircle :size="16" class="stat-icon success" />
        <span>{{ completedCount }} выполнено</span>
      </div>

      <div class="stat">
        <Circle :size="16" class="stat-icon" />
        <span>{{ pendingCount }} в работе</span>
      </div>
    </div>

    <div class="card-progress">
      <div class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ progressPercent }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle, Circle, Trash2, Edit2 } from 'lucide-vue-next'

const props = defineProps({
  list: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['delete', 'edit'])

const router = useRouter()

const completedCount = computed(() => props.list.stats?.completed || 0)
const pendingCount = computed(() => props.list.stats?.pending || 0)
const totalCount = computed(() => props.list.stats?.total || 0)

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const openList = () => {
  router.push(`/todos/${props.list.id}`)
}

const deleteList = () => {
  emit('delete', props.list.id)
}
</script>

<style scoped>
.todo-list-card {
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.todo-list-card:hover .card-actions {
  opacity: 1;
}

.card-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-icon {
  flex-shrink: 0;
}

.stat-icon.success {
  color: var(--success);
}

.card-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--success);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}
</style>