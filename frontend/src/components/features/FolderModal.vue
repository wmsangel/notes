<!-- frontend/src/components/features/FolderModal.vue -->
<template>
  <ModalBase :title="isEdit ? 'Редактировать папку' : 'Новая папка'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Название папки</label>
        <input
            type="text"
            class="input"
            v-model="formData.name"
            placeholder="Введите название"
            required
            autofocus
        />
      </div>

      <div class="form-group">
        <label class="form-label">Цвет</label>
        <div class="color-picker">
          <button
              v-for="color in colors"
              :key="color"
              type="button"
              class="color-option"
              :class="{ 'active': formData.color === color }"
              :style="{ background: color }"
              @click="formData.color = color"
          ></button>
        </div>
      </div>

      <div class="form-group" v-if="!parentId && !isEdit">
        <label class="form-label">Родительская папка (опционально)</label>
        <select class="input" v-model="formData.parent_id">
          <option :value="null">Нет (корневая папка)</option>
          <option
              v-for="folder in foldersStore.folders"
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
      <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="loading">
        <Loader v-if="loading" class="spinner" :size="16" />
        {{ isEdit ? 'Сохранить' : 'Создать' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import ModalBase from '@/components/ui/ModalBase.vue'
import { Loader } from 'lucide-vue-next'

const props = defineProps({
  folder: {
    type: Object,
    default: null
  },
  parentId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const loading = ref(false)
const colors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#06b6d4', '#64748b'
]

const isEdit = computed(() => !!props.folder)

const formData = reactive({
  name: '',
  color: '#6366f1',
  parent_id: props.parentId || null
})

onMounted(() => {
  if (props.folder) {
    formData.name = props.folder.name
    formData.color = props.folder.color
    formData.parent_id = props.folder.parent_id
  }
})

const handleSubmit = async () => {
  if (!formData.name.trim()) {
    uiStore.showError('Введите название папки')
    return
  }

  loading.value = true

  try {
    if (isEdit.value) {
      await foldersStore.updateFolder(props.folder.id, formData)
      uiStore.showSuccess('Папка обновлена')
    } else {
      const created = await foldersStore.createFolder(formData)
      uiStore.showSuccess('Папка создана')
      if (created?.id) {
        router.push(`/folder/${created.id}`)
      }
    }
    emit('close')
  } catch (error) {
    uiStore.showError('Ошибка при сохранении папки')
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

.color-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 3px solid transparent;
  cursor: pointer;
  transition: var(--transition);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--text);
  box-shadow: 0 0 0 2px var(--bg);
}
</style>
