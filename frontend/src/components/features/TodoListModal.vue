<!-- frontend/src/components/features/TodoListModal.vue -->
<template>
  <ModalBase :title="isEdit ? 'Редактировать список' : 'Создать TODO лист'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Название</label>
        <input
            type="text"
            class="input"
            v-model="formData.title"
            placeholder="Название списка"
            required
            autofocus
        />
      </div>

      <div class="form-group">
        <label class="form-label">Описание (опционально)</label>
        <textarea
            class="input textarea"
            v-model="formData.description"
            placeholder="Описание списка задач"
            rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Папка (опционально)</label>
        <select class="input" v-model="formData.folder_id">
          <option :value="null">Без папки</option>
          <option
              v-for="folder in folderOptions"
              :key="folder.id"
              :value="folder.id"
          >
            {{ folder.name }}
          </option>
        </select>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">
        Отмена
      </button>
      <button
          type="button"
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="loading"
      >
        <Loader v-if="loading" class="spinner" :size="16" />
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useTodosStore } from '@/stores/todos'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import ModalBase from '@/components/ui/ModalBase.vue'
import { Loader } from 'lucide-vue-next'

const props = defineProps({
  initialList: { type: Object, default: null },
  onCreated: { type: Function, default: null },
  onUpdated: { type: Function, default: null }
})

const emit = defineEmits(['close', 'created'])

const todosStore = useTodosStore()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const loading = ref(false)

const isEdit = computed(() => !!props.initialList?.id)

const folderOptions = computed(() =>
  (foldersStore.flatFolders?.length ? foldersStore.flatFolders : foldersStore.folders) || []
)

const formData = reactive({
  title: '',
  description: '',
  folder_id: null
})

function initFromList(list) {
  formData.title = list?.title ?? ''
  formData.description = list?.description ?? ''
  formData.folder_id = list?.folder_id ?? null
}

initFromList(props.initialList)

watch(() => props.initialList, (list) => {
  initFromList(list)
}, { immediate: false })

const handleSubmit = async () => {
  if (!formData.title.trim()) {
    uiStore.showError('Введите название списка')
    return
  }

  loading.value = true

  try {
    if (isEdit.value) {
      const updated = await todosStore.updateList(props.initialList.id, {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        folder_id: formData.folder_id
      })
      uiStore.showSuccess('Список обновлён')
      if (typeof props.onUpdated === 'function') props.onUpdated(updated)
      emit('close')
    } else {
      const list = await todosStore.createList(formData)
      uiStore.showSuccess('Список создан')
      emit('created', list)
      if (typeof props.onCreated === 'function') props.onCreated(list)
    }
  } catch (error) {
    uiStore.showError(isEdit.value ? 'Ошибка при сохранении списка' : 'Ошибка при создании списка')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}
</style>