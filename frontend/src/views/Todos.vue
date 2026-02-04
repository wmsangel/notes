<!-- frontend/src/views/Todos.vue -->
<template>
  <MainLayout>
    <div class="todos-page">
      <div class="page-header">
        <h1 class="page-title">Задачи</h1>
        <p class="page-subtitle">Списки задач и проекты</p>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="20" />
          Создать список
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <Loader :size="32" class="spinner" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="lists.length" class="lists-grid">
        <TodoListCard
          v-for="list in lists"
          :key="list.id"
          :list="list"
          @delete="handleDeleteList"
          @edit="handleEditList"
        />
      </div>

      <div v-else class="empty-state">
        <ListTodo :size="64" class="empty-icon" />
        <h2 class="empty-title">Нет списков задач</h2>
        <p class="empty-text">Создайте первый список, чтобы начать планировать задачи</p>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="20" />
          Создать список
        </button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTodosStore } from '@/stores/todos'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import TodoListCard from '@/components/features/TodoListCard.vue'
import TodoListModal from '@/components/features/TodoListModal.vue'
import { Plus, ListTodo, Loader } from 'lucide-vue-next'

const todosStore = useTodosStore()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const loading = ref(true)
const lists = ref([])

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      todosStore.fetchLists(),
      foldersStore.fetchFolderTree(),
      foldersStore.fetchFolders()
    ])
    lists.value = todosStore.lists
  } catch (error) {
    uiStore.showError('Ошибка загрузки списков')
  } finally {
    loading.value = false
  }
})

const openCreateModal = () => {
  uiStore.openModal(TodoListModal, {
    onCreated: async () => {
      await todosStore.fetchLists()
      lists.value = todosStore.lists
    }
  })
}

const handleDeleteList = async (listId) => {
  if (!confirm('Удалить этот список задач?')) return
  try {
    await todosStore.deleteList(listId)
    lists.value = lists.value.filter(l => l.id !== listId)
    uiStore.showSuccess('Список удалён')
  } catch (error) {
    uiStore.showError('Ошибка удаления списка')
  }
}

const handleEditList = (list) => {
  uiStore.openModal(TodoListModal, {
    initialList: list,
    onUpdated: async () => {
      await todosStore.fetchLists()
      lists.value = todosStore.lists
    }
  })
}
</script>

<style scoped>
.todos-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px 0;
  width: 100%;
}

.page-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  flex: 1;
}

.page-header .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.empty-state .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn {
    width: 100%;
    justify-content: center;
  }

  .lists-grid {
    grid-template-columns: 1fr;
  }
}
</style>
