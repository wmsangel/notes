<!-- frontend/src/components/features/QuickAdd.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="quick-add-overlay" @click="$emit('close')">
        <div class="quick-add" @click.stop>
          <div class="quick-add-header">
            <h3 class="quick-add-title">Быстрое добавление</h3>
            <button class="btn btn-icon-sm btn-ghost" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <div class="quick-add-body">
            <input
                ref="inputRef"
                type="text"
                class="input"
                v-model="title"
                @keydown.enter="handleCreate"
                :placeholder="type === 'page' ? 'Название страницы (необязательно)' : 'Название заметки...'"
            />

            <div class="quick-add-options">
              <button
                  class="option-btn"
                  :class="{ 'active': type === 'note' }"
                  @click="type = 'note'"
              >
                <FileText :size="18" />
                <span>Заметка</span>
              </button>

              <button
                  class="option-btn"
                  :class="{ 'active': type === 'page' }"
                  @click="type = 'page'"
              >
                <LayoutDashboard :size="18" />
                <span>Страница</span>
              </button>

              <button
                  class="option-btn"
                  :class="{ 'active': type === 'todo' }"
                  @click="type = 'todo'"
              >
                <CheckSquare :size="18" />
                <span>TODO</span>
              </button>
            </div>

            <div class="quick-add-folder" v-if="foldersStore.folders.length">
              <label class="form-label">Папка</label>
              <select class="input" v-model="folderId">
                <option :value="null">Без папки</option>
                <option
                    v-for="folder in foldersStore.folders"
                    :key="folder.id"
                    :value="folder.id"
                >
                  {{ folder.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="quick-add-footer">
            <button class="btn btn-secondary" @click="$emit('close')">
              Отмена
            </button>
            <button
                class="btn btn-primary"
                @click="handleCreate"
                :disabled="(type !== 'page' && !title.trim()) || loading"
            >
              <Loader v-if="loading" class="spinner" :size="16" />
              Создать
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { useTodosStore } from '@/stores/todos'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import { X, FileText, CheckSquare, Loader, LayoutDashboard } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const router = useRouter()
const notesStore = useNotesStore()
const todosStore = useTodosStore()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const inputRef = ref(null)
const title = ref('')
const type = ref('note')
const folderId = ref(null)
const loading = ref(false)

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})

const PAGE_PLACEHOLDER_HTML = '<p>Добавьте сюда ссылки на другие заметки с помощью кнопки «Ссылка на заметку» в панели редактора. Можно дополнять страницу любым текстом.</p>'

const handleCreate = async () => {
  if (type.value !== 'page' && !title.value.trim()) return

  loading.value = true

  try {
    if (type.value === 'note') {
      const note = await notesStore.createNote({
        title: title.value,
        folder_id: folderId.value,
        content: ''
      })
      uiStore.showSuccess('Заметка создана')
      router.push(`/notes/${note.id}`)
    } else if (type.value === 'page') {
      const note = await notesStore.createNote({
        title: title.value.trim() || 'Новая страница',
        folder_id: folderId.value,
        content: PAGE_PLACEHOLDER_HTML,
        note_type: 'page'
      })
      uiStore.showSuccess('Страница создана')
      router.push(`/notes/${note.id}`)
    } else {
      const list = await todosStore.createList({
        title: title.value,
        folder_id: folderId.value,
        description: ''
      })
      uiStore.showSuccess('TODO лист создан')
      router.push(`/todos/${list.id}`)
    }

    emit('close')
  } catch (error) {
    uiStore.showError('Ошибка при создании')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.quick-add-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.quick-add {
  background: var(--bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 500px;
  max-width: calc(100vw - 40px);
}

.quick-add-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.quick-add-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.quick-add-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quick-add-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border);
  background: var(--bg);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.option-btn:hover {
  border-color: var(--primary);
  color: var(--text);
}

.option-btn.active {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
}

.quick-add-folder {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-add-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>