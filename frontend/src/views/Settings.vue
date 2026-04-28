<!-- frontend/src/views/Settings.vue -->
<template>
  <MainLayout>
    <div class="settings-page">
      <div class="page-header">
        <h1 class="page-title">Настройки</h1>
        <p class="page-subtitle">Автосохранение, тема, горячие клавиши</p>
      </div>

      <div class="settings-sections card">
        <section class="settings-section">
          <h2 class="section-title">Внешний вид</h2>
          <div class="setting-row">
            <span class="setting-label">Тема</span>
            <button class="btn btn-secondary" @click="toggleTheme">
              {{ theme === 'dark' ? 'Тёмная' : 'Светлая' }} — переключить
            </button>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">Горячие клавиши</h2>
          <ul class="shortcuts-list">
            <li><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> — быстрое добавление</li>
            <li><kbd>Escape</kbd> — закрыть модалку / поиск</li>
          </ul>
        </section>

        <section class="settings-section">
          <h2 class="section-title">Экспорт в Apple Notes</h2>
          <p class="setting-desc">
            Перенос заметок в стандартное приложение «Заметки» macOS.
            Работает только когда сервер запущен на Mac — backend выполняет AppleScript
            и передаёт заметки в Apple Notes напрямую.
          </p>

          <div v-if="capabilitiesLoading" class="setting-desc setting-row-space">
            Проверяем доступность…
          </div>

          <div
              v-else-if="!capabilities?.appleNotes?.available"
              class="setting-desc setting-row-space export-warning"
          >
            <strong>Недоступно.</strong>
            {{ capabilities?.appleNotes?.reason || 'Apple Notes доступен только на macOS-сервере.' }}
          </div>

          <div v-else class="export-form">
            <div class="export-field">
              <label class="form-label">Что экспортировать</label>
              <div class="radio-row">
                <label class="radio-item">
                  <input type="radio" value="all" v-model="exportScope" />
                  <span>Все заметки</span>
                </label>
                <label class="radio-item">
                  <input type="radio" value="folder" v-model="exportScope" />
                  <span>Папка</span>
                </label>
              </div>
            </div>

            <div class="export-field" v-if="exportScope === 'folder'">
              <label class="form-label">Папка</label>
              <select class="input" v-model="exportFolderId">
                <option :value="null">Без папки (корневые)</option>
                <option v-for="f in folders" :key="f.id" :value="f.id">
                  {{ f.name }}
                </option>
              </select>
            </div>

            <div class="export-field">
              <label class="form-label">Папка в Apple Notes</label>
              <input
                  type="text"
                  class="input"
                  v-model="exportTargetFolder"
                  placeholder="Imported from Notes System"
              />
              <span class="form-hint">
                Если папки с таким именем нет — она будет создана автоматически.
              </span>
            </div>

            <label class="checkbox-row">
              <input type="checkbox" v-model="includeAttachments" />
              <span>Включить вложения (картинки + файлы)</span>
            </label>

            <div class="setting-row setting-row-space">
              <button
                  class="btn btn-primary"
                  :disabled="exporting"
                  @click="runExport"
              >
                {{ exporting ? 'Экспортируем…' : 'Экспортировать в Apple Notes' }}
              </button>
            </div>

            <div v-if="exportResult" class="export-result" :class="exportResultClass">
              <div class="export-result-summary">
                <strong v-if="exportResult.ok">Готово</strong>
                <strong v-else>Завершено с ошибками</strong>
                <span>
                  Успешно: {{ exportResult.succeeded || 0 }} ·
                  Ошибок: {{ exportResult.failed || 0 }}
                  <template v-if="exportResult.skipped">
                    · Пропущено: {{ exportResult.skipped }}
                  </template>
                  · Всего: {{ exportResult.total || 0 }}
                </span>
              </div>
              <details
                  v-if="exportResultDetails.length"
                  class="export-result-details"
              >
                <summary>Подробности ({{ exportResultDetails.length }})</summary>
                <ul>
                  <li
                      v-for="(item, idx) in exportResultDetails"
                      :key="idx"
                      :class="item.ok ? 'ok' : 'err'"
                  >
                    <span class="export-result-title">
                      {{ item.title || `Заметка #${item.id}` }}
                    </span>
                    <span v-if="item.skipped" class="export-result-tag">пропущена</span>
                    <span v-else-if="item.ok" class="export-result-tag ok">экспортирована</span>
                    <span v-else class="export-result-tag err">{{ item.error || 'ошибка' }}</span>
                  </li>
                </ul>
              </details>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">Кэш и данные</h2>
          <p class="setting-desc">
            Если что-то отображается неправильно после обновления версии, вы можете очистить локальный кэш приложения.
          </p>
          <div class="setting-row setting-row-space">
            <span class="setting-label">Очистить кэш и локальные настройки</span>
            <button class="btn btn-secondary" @click="clearCache" :disabled="clearing">
              {{ clearing ? 'Очищаем…' : 'Очистить кэш' }}
            </button>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">О приложении</h2>
          <p class="setting-desc">Notes System — заметки и задачи. Автосохранение заметок при редактировании.</p>
        </section>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useUIStore } from '@/stores/ui'
import MainLayout from '@/components/layout/MainLayout.vue'
import { exportApi } from '@/services/api/export'

const { theme, toggleTheme } = useTheme()
const uiStore = useUIStore()
const clearing = ref(false)

// --- Apple Notes export state ---
const capabilities = ref(null)
const capabilitiesLoading = ref(true)
const folders = ref([])
const exportScope = ref('all')
const exportFolderId = ref(null)
const exportTargetFolder = ref('Imported from Notes System')
const includeAttachments = ref(true)
const exporting = ref(false)
const exportResult = ref(null)

const exportResultDetails = computed(() => {
  return Array.isArray(exportResult.value?.results) ? exportResult.value.results : []
})

const exportResultClass = computed(() => ({
  'export-result--ok': !!exportResult.value?.ok,
  'export-result--err': exportResult.value && !exportResult.value.ok
}))

async function loadCapabilities () {
  capabilitiesLoading.value = true
  try {
    const { data } = await exportApi.getCapabilities()
    capabilities.value = data
  } catch (e) {
    capabilities.value = { appleNotes: { available: false, reason: 'Не удалось получить статус сервера' } }
  } finally {
    capabilitiesLoading.value = false
  }
}

async function loadFolders () {
  try {
    const { data } = await exportApi.getFolders()
    folders.value = Array.isArray(data) ? data : []
  } catch (e) {
    folders.value = []
  }
}

async function runExport () {
  if (exporting.value) return
  if (!capabilities.value?.appleNotes?.available) return

  const scope = exportScope.value
  const messageScope = scope === 'folder'
      ? (folders.value.find(f => f.id === exportFolderId.value)?.name || 'выбранную папку')
      : 'все заметки'

  if (!confirm(`Экспортировать ${messageScope} в Apple Notes?\nПроцесс может занять несколько минут.`)) {
    return
  }

  exporting.value = true
  exportResult.value = null
  try {
    const payload = {
      scope,
      folder_id: scope === 'folder' ? exportFolderId.value : null,
      target_folder: (exportTargetFolder.value || '').trim() || undefined,
      include_attachments: includeAttachments.value
    }
    const { data } = await exportApi.exportToAppleNotes(payload)
    exportResult.value = data
    if (data?.ok) {
      uiStore.showSuccess(`Экспорт завершён: ${data.succeeded || 0} из ${data.total || 0}`)
    } else {
      uiStore.showError(`Экспорт с ошибками: ${data?.failed || 0} из ${data?.total || 0}`)
    }
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Ошибка экспорта'
    uiStore.showError(msg)
    exportResult.value = { ok: false, error: msg, results: [] }
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  await loadCapabilities()
  if (capabilities.value?.appleNotes?.available) {
    loadFolders()
  }
})

const clearCache = async () => {
  if (clearing.value) return
  if (!confirm('Очистить кэш приложения и локальные настройки?')) return
  clearing.value = true
  try {
    try {
      localStorage.clear()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear()
      }
    } catch (_) {}

    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }

    uiStore.showSuccess('Кэш очищен. Перезагрузите страницу.')
  } catch (e) {
    uiStore.showError('Не удалось полностью очистить кэш')
  } finally {
    clearing.value = false
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 640px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.settings-sections {
  padding: 0;
  overflow: hidden;
}

.settings-section {
  padding: 24px 28px;
  border-bottom: 1px solid var(--border-light);
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px 0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-row-space {
  margin-top: 16px;
}

.setting-label {
  font-size: 15px;
  color: var(--text-secondary);
}

.shortcuts-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.shortcuts-list li {
  padding: 8px 0;
  font-size: 15px;
  color: var(--text-secondary);
}

.shortcuts-list kbd {
  display: inline-block;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-right: 4px;
}

.setting-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.export-warning {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--warning-soft, var(--bg-tertiary));
  border: 1px solid var(--border-light);
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.export-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-form .form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.export-form .input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: var(--transition);
}

.export-form .input:focus {
  border-color: var(--primary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.radio-item,
.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
}

.checkbox-row {
  user-select: none;
}

.export-result {
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  font-size: 14px;
  color: var(--text-secondary);
}

.export-result--ok {
  border-color: var(--success, #16a34a);
  background: var(--success-soft, rgba(22, 163, 74, 0.08));
}

.export-result--err {
  border-color: var(--danger, #dc2626);
  background: var(--danger-soft, rgba(220, 38, 38, 0.08));
}

.export-result-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
}

.export-result-details {
  margin-top: 10px;
}

.export-result-details summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
}

.export-result-details ul {
  margin: 8px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.export-result-details li {
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  color: var(--text-secondary);
}

.export-result-details li.ok {
  color: var(--text);
}

.export-result-details li.err {
  color: var(--danger, #dc2626);
}

.export-result-title {
  font-weight: 500;
}

.export-result-tag {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.export-result-tag.ok {
  background: var(--success-soft, rgba(22, 163, 74, 0.1));
  color: var(--success, #16a34a);
}

.export-result-tag.err {
  background: var(--danger-soft, rgba(220, 38, 38, 0.1));
  color: var(--danger, #dc2626);
}
</style>
