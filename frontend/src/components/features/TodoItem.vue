<!-- frontend/src/components/features/TodoItem.vue -->
<template>
  <div class="todo-item" :class="{ 'completed': item.is_completed }">
    <div class="item-main">
      <button
          class="checkbox-btn"
          @click="handleToggle"
          :disabled="toggling"
      >
        <CheckCircle v-if="item.is_completed" :size="20" />
        <Circle v-else :size="20" />
      </button>

      <div class="item-content" v-if="!editing">
        <div class="item-title" @dblclick="startEdit">
          {{ item.title }}
        </div>
        <div class="item-description" v-if="item.description">
          {{ item.description }}
        </div>
        <div class="item-due" v-if="item.due_date">
          <Calendar :size="12" />
          {{ formatDueDate(item.due_date) }}
        </div>
      </div>

      <div class="item-edit" v-else>
        <input
            ref="editInput"
            type="text"
            class="input"
            v-model="editTitle"
            @keydown.enter="saveEdit"
            @keydown.esc="cancelEdit"
            @blur="saveEdit"
        />
      </div>

      <div class="item-actions">
        <input
            type="date"
            class="due-date-input"
            :value="dueDateInputValue"
            @change="onDueDateChange"
            title="Срок выполнения"
        />
        <select
            class="priority-select"
            :class="`priority-${item.priority}`"
            v-model="localPriority"
            @change="updatePriority"
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click="startEdit"
            title="Редактировать"
        >
          <Edit2 :size="14" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click="handleDelete"
            title="Удалить"
            :disabled="deleting"
        >
          <Trash2 :size="14" />
        </button>

        <slot name="append-actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { CheckCircle, Circle, Edit2, Trash2, Calendar } from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'update', 'delete'])

const editing = ref(false)
const editTitle = ref('')
const editInput = ref(null)
const localPriority = ref(props.item.priority)
const toggling = ref(false)
const deleting = ref(false)

const handleToggle = async () => {
  if (toggling.value) return // Защита от двойного клика

  toggling.value = true
  try {
    await emit('toggle', props.item.id)
  } finally {
    setTimeout(() => {
      toggling.value = false
    }, 500)
  }
}

const handleDelete = async () => {
  if (deleting.value) return // Защита от двойного клика

  deleting.value = true
  try {
    await emit('delete', props.item.id)
  } finally {
    setTimeout(() => {
      deleting.value = false
    }, 500)
  }
}

const startEdit = async () => {
  editing.value = true
  editTitle.value = props.item.title

  await nextTick()
  editInput.value?.focus()
  editInput.value?.select()
}

const saveEdit = () => {
  if (!editTitle.value.trim()) {
    cancelEdit()
    return
  }

  if (editTitle.value !== props.item.title) {
    emit('update', props.item.id, { title: editTitle.value })
  }

  editing.value = false
}

const cancelEdit = () => {
  editing.value = false
  editTitle.value = ''
}

const updatePriority = () => {
  emit('update', props.item.id, { priority: localPriority.value })
}

function formatDueDate(val) {
  if (!val) return ''
  const d = new Date(val)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const dueDateInputValue = computed(() => {
  const val = props.item.due_date
  if (!val) return ''
  const d = new Date(val)
  return d.toISOString().slice(0, 10)
})

const onDueDateChange = (e) => {
  const v = e.target?.value
  const newDate = v ? `${v}T12:00:00.000Z` : null
  emit('update', props.item.id, { due_date: newDate })
}
</script>

<style scoped>
.todo-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:hover {
  background: var(--bg-secondary);
}

.todo-item.completed {
  opacity: 0.6;
}

.item-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.checkbox-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--radius-sm);
}

.checkbox-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--success);
}

.checkbox-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-item.completed .checkbox-btn {
  color: var(--success);
}

.item-content {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.5;
  word-break: break-word;
}

.todo-item.completed .item-title {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.item-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.5;
}

.item-due {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.due-date-input {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.due-date-input:hover {
  border-color: var(--primary);
}

.item-edit {
  flex: 1;
}

.item-edit .input {
  width: 100%;
  padding: 8px 12px;
  font-size: 15px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.todo-item:hover .item-actions {
  opacity: 1;
}

.priority-select {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
}

.priority-select.priority-low {
  color: var(--text-secondary);
  border-color: var(--text-secondary);
}

.priority-select.priority-medium {
  color: var(--warning);
  border-color: var(--warning);
}

.priority-select.priority-high {
  color: var(--danger);
  border-color: var(--danger);
}

.priority-select:hover {
  opacity: 0.8;
}
</style>