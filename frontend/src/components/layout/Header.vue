<!-- frontend/src/components/layout/Header.vue -->
<template>
  <header class="header">
    <div class="header-left">
      <button
          class="btn btn-icon btn-ghost mobile-menu-btn"
          @click="uiStore.toggleSidebarCollapse"
      >
        <Menu :size="20" />
      </button>
      <img class="header-logo" src="/logo.svg" alt="IZN Notes" />
      <Breadcrumbs />
    </div>

    <div class="header-right">
      <button
          class="btn btn-icon btn-ghost"
          @click="handleSync"
          :disabled="syncing"
          title="Синхронизация"
      >
        <RefreshCw :size="20" :class="{ 'spinning': syncing }" />
      </button>

      <button
          class="btn btn-icon btn-ghost"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Светлая тема' : 'Темная тема'"
      >
        <Sun v-if="theme === 'dark'" :size="20" />
        <Moon v-else :size="20" />
      </button>

      <div class="divider"></div>

      <div class="install-wrap">
        <button
            v-if="pwa.isInstallable && !pwa.isInstalled"
            class="btn btn-ghost install-btn"
            @click="pwa.install()"
            title="Установить приложение"
        >
          Установить
        </button>
        <button
            v-else-if="pwa.isSafari && !pwa.isInstalled"
            class="btn btn-icon btn-ghost"
            @click="showSafariHint = !showSafariHint"
            title="Как установить (Safari)"
        >
          <Download :size="20" />
        </button>
        <div v-if="pwa.isSafari && showSafariHint" class="safari-install-hint">
          <strong>Установка в Safari:</strong><br>
          <template v-if="pwa.isIOS">Нажмите «Поделиться» → «На экран «Домой»»</template>
          <template v-else>Меню «Файл» → «Добавить на панель Dock»</template>
        </div>
      </div>
      <button class="btn btn-icon btn-ghost" @click="openSettings" title="Настройки">
        <Settings :size="20" />
      </button>
    </div>

  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useNotesStore } from '@/stores/notes'
import { useTheme } from '@/composables/useTheme'
import { Menu, RefreshCw, Settings, Sun, Moon, Download } from 'lucide-vue-next'
import { usePwaInstall } from '@/composables/usePwaInstall'
import Breadcrumbs from './Breadcrumbs.vue'

const router = useRouter()
const pwa = usePwaInstall()
const showSafariHint = ref(false)
const uiStore = useUIStore()
const notesStore = useNotesStore()
const { theme, toggleTheme } = useTheme()

const syncing = ref(false)

const handleSync = async () => {
  syncing.value = true
  try {
    await Promise.all([
      notesStore.fetchNotes()
    ])
    uiStore.showSuccess('Синхронизация завершена')
  } catch (error) {
    uiStore.showError('Ошибка синхронизации')
  } finally {
    syncing.value = false
  }
}

const openSettings = () => {
  router.push('/settings')
}
</script>

<style scoped>
.header {
  min-height: calc(var(--header-h) + var(--safe-top));
  background: var(--surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--safe-top) 20px 0;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 50;
}

[data-theme="dark"] .header {
  border-bottom-color: var(--border);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left {
  min-width: 0;
}

.header-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  box-shadow: var(--shadow-xs);
}

.mobile-menu-btn {
  display: none;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  border-radius: 1px;
}

.install-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.install-btn {
  font-size: 13px;
  padding: 6px 12px;
}

.safari-install-hint {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  padding: 10px 12px;
  background: var(--surface-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 12px;
  color: var(--text-secondary);
  z-index: 100;
  white-space: normal;
}

.spinning {
  animation: spin 1s linear infinite;
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 20px;
  width: 380px;
  max-width: calc(100vw - 40px);
  background: var(--surface-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.results-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.results-count {
  background: var(--surface-raised);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.results-list {
  overflow-y: auto;
  max-height: 300px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  text-decoration: none;
  color: var(--text);
  transition: var(--transition);
  border-bottom: 1px solid var(--border-subtle);
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: var(--surface-raised);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-date {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .header {
    padding-left: calc(16px + var(--safe-left));
    padding-right: calc(16px + var(--safe-right));
  }

  .header-logo {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .search-box {
    flex: 1;
    width: auto;
  }

  .search-results {
    left: 16px;
    right: 16px;
    width: auto;
  }
}
</style>
