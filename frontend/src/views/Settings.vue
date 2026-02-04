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
          <h2 class="section-title">О приложении</h2>
          <p class="setting-desc">Notes System — заметки и задачи. Автосохранение заметок при редактировании.</p>
        </section>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/components/layout/MainLayout.vue'

const { theme, toggleTheme } = useTheme()
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
</style>
