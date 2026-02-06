<!-- frontend/src/components/features/ProjectLinkModal.vue -->
<template>
  <ModalBase title="Добавить проект" @close="$emit('close')">
    <form class="project-link-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Название проекта</label>
        <input
          v-model="form.title"
          class="input"
          type="text"
          placeholder="Например: Мои финансы"
          required
          autofocus
        />
      </div>
      <div class="form-group">
        <label class="form-label">URL</label>
        <input
          v-model="form.url"
          class="input"
          type="url"
          placeholder="https://..."
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Иконка (URL)</label>
        <div class="form-row">
          <input
            v-model="form.icon_url"
            class="input"
            type="url"
            placeholder="Оставьте пустым или нажмите Favicon"
          />
          <button type="button" class="btn btn-secondary" @click="useFavicon">
            Favicon
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">
        Отмена
      </button>
      <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="loading">
        <Loader v-if="loading" class="spinner" :size="16" />
        {{ loading ? 'Добавление…' : 'Добавить' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import { dashboardApi } from '@/services/api/dashboard'
import ModalBase from '@/components/ui/ModalBase.vue'
import { Loader } from 'lucide-vue-next'

const props = defineProps({
  onCreated: {
    type: Function,
    default: null
  }
})

defineEmits(['close'])

const uiStore = useUIStore()
const loading = ref(false)
const form = reactive({
  title: '',
  url: '',
  icon_url: ''
})

const getFavicon = (url) => {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`
  } catch {
    return ''
  }
}

const useFavicon = () => {
  if (!form.url) return
  form.icon_url = getFavicon(form.url)
}

const handleSubmit = async () => {
  if (!form.title.trim() || !form.url.trim()) {
    uiStore.showError('Введите название и URL')
    return
  }
  loading.value = true
  try {
    const res = await dashboardApi.createLink({
      title: form.title.trim(),
      url: form.url.trim(),
      icon_url: form.icon_url?.trim() || null
    })
    props.onCreated?.(res.data)
    form.title = ''
    form.url = ''
    form.icon_url = ''
    uiStore.closeModal()
  } catch (error) {
    uiStore.showError('Ошибка добавления ссылки')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.project-link-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row .input {
  flex: 1;
  min-width: 0;
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
