<!-- frontend/src/views/NoteView.vue - с защитой паролем -->
<template>
  <MainLayout>
    <!-- Модалка ввода пароля -->
    <div class="password-modal" v-if="showPasswordPrompt" @click.self="cancelPassword">
      <div class="password-dialog card">
        <h3>Защищенная заметка</h3>
        <p v-if="note?.protection_hint">{{ note.protection_hint }}</p>
        <p v-else>Введите пароль для доступа</p>

        <input
            ref="passwordInput"
            type="password"
            class="input"
            v-model="passwordAttempt"
            @keydown.enter="checkPassword"
            placeholder="Пароль"
            autofocus
        />

        <div class="password-actions">
          <button class="btn btn-secondary" @click="cancelPassword">Отмена</button>
          <button class="btn btn-primary" @click="checkPassword">Открыть</button>
        </div>
      </div>
    </div>

    <div class="note-view" v-if="!showPasswordPrompt">
      <div class="note-header">
        <button class="btn btn-ghost back-btn" @click="goBack">
          <ArrowLeft :size="20" />
          Назад
        </button>

        <div class="header-meta">
          <select
              class="folder-select"
              v-model="selectedFolder"
              @change="handleFolderChange"
          >
            <option :value="null">Без папки</option>
            <option
                v-for="folder in folderOptions"
                :key="folder.id"
                :value="folder.id"
            >
              {{ folder.name }}
            </option>
          </select>
          <div class="note-tags-row">
            <span
                v-for="(tag, index) in noteTags"
                :key="`${tag}-${index}`"
                class="tag-chip"
            >
              {{ tag }}
              <button
                  type="button"
                  class="tag-remove"
                  @click="removeTag(index)"
                  title="Удалить тег"
                  aria-label="Удалить тег"
              >
                <X :size="12" />
              </button>
            </span>
            <input
                ref="tagInputRef"
                type="text"
                class="tag-input"
                v-model="newTag"
                @keydown="onTagInputKeydown"
                placeholder="Тег..."
                maxlength="50"
            />
          </div>
        </div>

        <div class="header-actions">
          <template v-if="isPage">
            <button
                class="btn btn-ghost btn-page-mode"
                :class="{ 'active': pageViewMode === 'view' }"
                @click="pageViewMode = 'view'"
                title="Просмотр"
            >
              <Eye :size="18" />
              <span>Просмотр</span>
            </button>
            <button
                class="btn btn-ghost btn-page-mode"
                :class="{ 'active': pageViewMode === 'edit' }"
                @click="pageViewMode = 'edit'"
                title="Редактировать"
            >
              <Pencil :size="18" />
              <span>Редактировать</span>
            </button>
          </template>
          <button
              class="btn btn-icon btn-ghost"
              @click="toggleFavorite"
              :class="{ 'active': note?.is_favorite }"
              title="Избранное"
          >
            <Star :size="20" :fill="note?.is_favorite ? 'currentColor' : 'none'" />
          </button>
          <button
              class="btn btn-icon btn-ghost"
              :class="{ 'active': note?.is_protected }"
              @click="toggleProtection"
              title="Защита паролем"
          >
            <Lock :size="20" v-if="note?.is_protected" />
            <Unlock :size="20" v-else />
          </button>
          <button
              class="btn btn-ghost btn-save"
              @click="saveNote(true)"
              :disabled="saving"
              title="Сохранить"
          >
            <Check :size="18" />
            <span>Сохранить</span>
          </button>
          <div class="save-indicator" v-if="saving">
            <Loader class="spinner" :size="16" />
            <span>Сохранение...</span>
          </div>
          <div class="save-indicator saved" v-else-if="saved">
            <Check :size="16" />
            <span>Сохранено</span>
          </div>
          <button class="btn btn-ghost" @click="deleteNote">
            <Trash2 :size="18" />
            Удалить
          </button>
        </div>
      </div>

      <input
          ref="titleInputRef"
          type="text"
          class="note-title-input"
          v-model="noteTitle"
          @input="handleTitleChange"
          :placeholder="isPage ? 'Название страницы' : 'Название заметки'"
      />

      <div v-if="isPage && pageViewMode === 'view'" class="page-view-wrapper">
        <PageView :content="noteContent" />
      </div>
      <div v-else class="editor-wrapper">
        <TiptapEditor
            :content="noteContent"
            :current-note-id="note?.id"
            @update="handleContentChange"
        />
      </div>

      <div class="attachments" v-if="note?.id">
        <div class="attachments-header">
          <div class="attachments-title">Вложения</div>
          <label class="btn btn-ghost btn-sm">
            <input type="file" class="file-input" @change="onPickAttachment" />
            Добавить файл
          </label>
        </div>

        <div v-if="attachmentsLoading" class="attachments-loading">Загрузка…</div>
        <div v-else-if="!attachments.length" class="attachments-empty">Нет вложений</div>
        <div v-else class="attachments-list">
          <div class="attachment" v-for="a in attachments" :key="a.id">
            <a class="attachment-link" :href="a.url" target="_blank" rel="noopener">
              {{ a.original_name || a.filename }}
            </a>
            <span class="attachment-meta">{{ formatBytes(a.size) }}</span>
            <button class="btn btn-icon-sm btn-ghost" @click="removeAttachment(a)" title="Удалить">×</button>
          </div>
        </div>
      </div>

      <div class="note-footer-meta" v-if="note">
        <span class="note-meta-date">
          <Clock :size="14" />
          Создано: {{ formatDate(note.created_at) }}
        </span>
        <span class="note-meta-date">
          Обновлено: {{ formatDate(note.updated_at) }}
        </span>
      </div>
    </div>

    <!-- Модалка настройки защиты -->
    <div class="protection-modal" v-if="showProtectionModal" @click.self="showProtectionModal = false">
      <div class="protection-dialog card">
        <h3>Защита заметки паролем</h3>

        <div class="form-group">
          <label class="form-label">Пароль</label>
          <input
              type="password"
              class="input"
              v-model="newPassword"
              placeholder="Введите пароль"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Подсказка (опционально)</label>
          <input
              type="text"
              class="input"
              v-model="passwordHint"
              placeholder="Например: имя кота"
          />
        </div>

        <div class="protection-actions">
          <button class="btn btn-secondary" @click="showProtectionModal = false">Отмена</button>
          <button class="btn btn-primary" @click="saveProtection">Защитить</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import { useDashboardStore } from '@/stores/dashboard'
import MainLayout from '@/components/layout/MainLayout.vue'
import TiptapEditor from '@/components/features/TiptapEditor.vue'
import PageView from '@/components/features/PageView.vue'
import { ArrowLeft, Star, Trash2, Clock, Loader, Check, Lock, Unlock, X, Eye, Pencil } from 'lucide-vue-next'
import { uploadApi } from '@/services/api/upload'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()
const dashboardStore = useDashboardStore()

const note = ref(null)
const noteTitle = ref('')
const noteContent = ref('')
const selectedFolder = ref(null)
const saving = ref(false)
const saved = ref(false)
const hasUnsavedChanges = ref(false)

const folderOptions = computed(() =>
  (foldersStore.flatFolders?.length ? foldersStore.flatFolders : foldersStore.folders) || []
)

// Защита паролем
const showPasswordPrompt = ref(false)
const passwordAttempt = ref('')
const passwordInput = ref(null)
const showProtectionModal = ref(false)
const newPassword = ref('')
const passwordHint = ref('')
const titleInputRef = ref(null)
const noteTags = ref([])
const newTag = ref('')
const tagInputRef = ref(null)
const pageViewMode = ref('view')

// Attachments
const attachments = ref([])
const attachmentsLoading = ref(false)

async function loadAttachments(noteId) {
  if (!noteId) return
  attachmentsLoading.value = true
  try {
    const res = await uploadApi.getAttachmentsByNote(noteId)
    attachments.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    attachments.value = []
  } finally {
    attachmentsLoading.value = false
  }
}

const onPickAttachment = async (e) => {
  const file = e.target?.files?.[0]
  e.target.value = ''
  if (!file || !note.value?.id) return
  try {
    await uploadApi.uploadAttachment(note.value.id, file)
    await loadAttachments(note.value.id)
    uiStore.showSuccess('Файл добавлен')
  } catch (err) {
    uiStore.showError(err?.response?.data?.error || err?.message || 'Ошибка загрузки файла')
  }
}

const removeAttachment = async (a) => {
  if (!a?.id) return
  if (!confirm('Удалить вложение?')) return
  try {
    await uploadApi.deleteAttachment(a.id)
    attachments.value = attachments.value.filter(x => x.id !== a.id)
    uiStore.showSuccess('Вложение удалено')
  } catch (err) {
    uiStore.showError(err?.response?.data?.error || err?.message || 'Ошибка удаления')
  }
}

function formatBytes(bytes) {
  const n = Number(bytes || 0)
  if (!n) return ''
  const units = ['B','KB','MB','GB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const isPage = computed(() => (note.value?.note_type || 'note') === 'page')

let saveTimeout = null

function scheduleFocusTitle() {
  setTimeout(() => {
    titleInputRef.value?.focus()
  }, 100)
}

async function loadNoteForId(noteId) {
  note.value = await notesStore.fetchNoteById(noteId)
  showPasswordPrompt.value = !!note.value.is_protected
  if ((note.value?.note_type || 'note') === 'page') {
    pageViewMode.value = 'view'
  }
  if (note.value.is_protected) {
    await nextTick()
    passwordInput.value?.focus()
    return
  }
  loadNoteContent()
  await loadAttachments(noteId)
  const isEmptyTitle = !(note.value.title && String(note.value.title).trim())
  if (isEmptyTitle) {
    await nextTick()
    scheduleFocusTitle()
  }
}

onMounted(async () => {
  await Promise.all([foldersStore.fetchFolders(), foldersStore.fetchFolderTree()])
  const noteId = route.params.id
  if (!noteId) return
  try {
    await loadNoteForId(noteId)
  } catch (error) {
    uiStore.showError('Ошибка загрузки заметки')
    router.push('/notes')
  }
})

watch(() => route.params.id, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  showPasswordPrompt.value = false
  try {
    await loadNoteForId(newId)
  } catch (error) {
    uiStore.showError('Ошибка загрузки заметки')
    router.push('/notes')
  }
})

const loadNoteContent = () => {
  const rawTitle = note.value.title ?? ''
  noteTitle.value = typeof rawTitle === 'string' ? rawTitle.trim() : ''
  noteContent.value = note.value.content ?? ''
  selectedFolder.value = note.value.folder_id
  noteTags.value = Array.isArray(note.value.tags) ? [...note.value.tags] : []
}

const onTagInputKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTagFromInput()
  }
}

const addTagFromInput = () => {
  const value = newTag.value.trim().replace(/,/g, '')
  if (!value) return
  const normalized = value.slice(0, 50)
  if (noteTags.value.includes(normalized)) {
    newTag.value = ''
    return
  }
  noteTags.value = [...noteTags.value, normalized]
  newTag.value = ''
  saveTags()
}

const removeTag = (index) => {
  noteTags.value = noteTags.value.filter((_, i) => i !== index)
  saveTags()
}

const saveTags = () => {
  if (!note.value?.id) return
  notesStore.updateNote(note.value.id, { tags: noteTags.value }).then((updated) => {
    if (updated && updated.tags) note.value.tags = updated.tags
  }).catch(() => {
    uiStore.showError('Ошибка сохранения тегов')
  })
}

const checkPassword = async () => {
  if (!passwordAttempt.value?.trim()) {
    uiStore.showError('Введите пароль')
    return
  }

  try {
    const unlocked = await notesStore.unlockNote(note.value.id, passwordAttempt.value.trim())
    Object.assign(note.value, unlocked)
    showPasswordPrompt.value = false
    loadNoteContent()
    passwordAttempt.value = ''
    const isEmptyTitle = !(note.value.title && String(note.value.title).trim())
    if (isEmptyTitle) {
      await nextTick()
      scheduleFocusTitle()
    }
  } catch (err) {
    const msg = err.response?.status === 403 ? 'Неверный пароль' : (err.response?.data?.error || 'Ошибка проверки пароля')
    uiStore.showError(msg)
    passwordAttempt.value = ''
  }
}

const cancelPassword = () => {
  router.push('/notes')
}

const toggleProtection = () => {
  if (note.value.is_protected) {
    // Снять защиту
    if (confirm('Снять защиту с этой заметки?')) {
      removeProtection()
    }
  } else {
    // Установить защиту
    showProtectionModal.value = true
  }
}

const saveProtection = async () => {
  if (!newPassword.value.trim()) {
    uiStore.showError('Введите пароль')
    return
  }

  try {
    await notesStore.updateNote(note.value.id, {
      is_protected: true,
      protection_password: newPassword.value,
      protection_hint: passwordHint.value || null
    })

    note.value.is_protected = true
    note.value.protection_hint = passwordHint.value || null

    uiStore.showSuccess('Защита установлена')
    showProtectionModal.value = false
    newPassword.value = ''
    passwordHint.value = ''
  } catch (error) {
    const msg = error?.response?.data?.error || error?.message || 'Ошибка установки защиты'
    uiStore.showError(msg)
  }
}

const removeProtection = async () => {
  try {
    await notesStore.updateNote(note.value.id, {
      is_protected: false,
      protection_password: null,
      protection_hint: null
    })

    note.value.is_protected = false
    uiStore.showSuccess('Защита снята')
  } catch (error) {
    const msg = error?.response?.data?.error || error?.message || 'Ошибка снятия защиты'
    uiStore.showError(msg)
  }
}

onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})

onBeforeRouteLeave(async (to, from, next) => {
  if (isNoteEmpty() && note.value?.id) {
    try {
      await notesStore.deleteNote(note.value.id)
    } catch (e) {
      // игнорируем ошибку удаления
    }
    next()
    return
  }
  if (hasUnsavedChanges.value) {
    const answer = confirm('У вас есть несохраненные изменения. Продолжить?')
    if (answer) {
      saveNote()
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

const handleTitleChange = () => {
  hasUnsavedChanges.value = true
  debouncedSave()
}

const handleContentChange = (newContent) => {
  noteContent.value = newContent
  hasUnsavedChanges.value = true
  debouncedSave()
}

const handleFolderChange = () => {
  hasUnsavedChanges.value = true
  debouncedSave()
}

const debouncedSave = () => {
  clearTimeout(saveTimeout)
  saved.value = false

  saveTimeout = setTimeout(() => {
    saveNote()
  }, 2000)
}

function isNoteEmpty() {
  const title = (noteTitle.value ?? '').trim()
  const raw = (noteContent.value ?? '').replace(/<[^>]*>/g, '').trim()
  return !title && !raw
}

const saveNote = async (force = false) => {
  if (!force && !hasUnsavedChanges.value) return

  if (isNoteEmpty()) {
    hasUnsavedChanges.value = false
    return
  }

  saving.value = true

  try {
    await notesStore.updateNote(note.value.id, {
      title: noteTitle.value,
      content: noteContent.value,
      folder_id: selectedFolder.value
    })

    hasUnsavedChanges.value = false
    saved.value = true

    setTimeout(() => {
      saved.value = false
    }, 2000)
  } catch (error) {
    uiStore.showError('Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

const toggleFavorite = async () => {
  try {
    await notesStore.toggleFavorite(note.value.id)
    note.value.is_favorite = !note.value.is_favorite
    dashboardStore.fetchStats()
  } catch (error) {
    uiStore.showError('Ошибка обновления избранного')
  }
}

const deleteNote = async () => {
  if (!confirm('Удалить эту заметку?')) return

  try {
    await notesStore.deleteNote(note.value.id)
    uiStore.showSuccess('Заметка удалена')
    router.push('/notes')
  } catch (error) {
    uiStore.showError('Ошибка удаления')
  }
}

const goBack = async () => {
  if (isNoteEmpty() && note.value?.id) {
    try {
      await notesStore.deleteNote(note.value.id)
    } catch (e) {
      // игнорируем
    }
    router.back()
    return
  }
  if (hasUnsavedChanges.value) {
    if (confirm('У вас есть несохраненные изменения. Сохранить?')) {
      await saveNote()
    }
  }
  router.back()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.note-view {
  max-width: none;
  width: 100%;
  margin: 0;
  padding-bottom: 100px;
}

.note-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  flex: 1;
  min-width: 0;
}

.header-meta .meta-item {
  margin: 0;
}

.header-meta .folder-select {
  max-width: 180px;
}

.header-meta .note-tags-row {
  flex: 1;
  min-width: 120px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-page-mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.btn-page-mode:hover {
  color: var(--text);
  background: var(--surface-raised);
}

.btn-page-mode.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.btn-save:hover:not(:disabled) {
  color: var(--primary);
  background: var(--primary-soft);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.page-view-wrapper {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 32px 40px;
  min-height: 200px;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.save-indicator.saved {
  color: var(--success);
}

.note-title-input {
  width: 100%;
  padding: 16px 0 24px;
  font-size: 36px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  margin-bottom: 0;
}

.note-title-input::placeholder {
  color: var(--text-tertiary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.folder-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.note-tags-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--surface-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 50%;
  opacity: 0.8;
  transition: var(--transition);
}

.tag-remove:hover {
  opacity: 1;
  background: var(--surface-hover, rgba(0, 0, 0, 0.06));
}

[data-theme="dark"] .tag-remove:hover {
  background: var(--surface-hover, rgba(255, 255, 255, 0.1));
}

.tag-input {
  min-width: 120px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text);
  outline: none;
  transition: var(--transition);
}

.tag-input::placeholder {
  color: var(--text-tertiary);
}

.tag-input:focus {
  border-color: var(--primary);
}

.editor-wrapper {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 32px 40px;
  min-height: 60vh;
  cursor: text;
  width: 100%;
}

.note-footer-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-tertiary);
}

.note-meta-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.note-meta-date svg {
  flex-shrink: 0;
  opacity: 0.8;
}

/* Модалки */
.password-modal,
.protection-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.password-dialog,
.protection-dialog {
  max-width: 400px;
  width: 100%;
  padding: 32px;
}

.password-dialog h3,
.protection-dialog h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
}

.password-dialog p {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
}

.password-actions,
.protection-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .note-view {
    padding-bottom: 60px;
  }

  .note-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-meta {
    order: 3;
    width: 100%;
    flex: none;
    padding-top: 8px;
    border-top: 1px solid var(--border-light);
  }

  .header-meta .note-tags-row {
    min-width: 0;
  }

  .tag-input {
    min-width: 100px;
  }

  .note-title-input {
    font-size: 28px;
    padding: 16px 0;
  }

  .editor-wrapper {
    padding: 20px;
    min-height: 400px;
  }

  .page-view-wrapper {
    padding: 20px;
  }

  .btn-page-mode span {
    display: none;
  }

  .btn-page-mode {
    padding: 8px;
  }
}
</style>