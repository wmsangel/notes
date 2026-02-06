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

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Trash2, Edit2 } from 'lucide-vue-next'

const props = defineProps({
  list: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['delete', 'edit'])

const router = useRouter()

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

</style>
