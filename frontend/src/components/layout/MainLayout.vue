<!-- frontend/src/components/layout/MainLayout.vue -->
<template>
  <div class="main-layout" :class="{ 'sidebar-open': !uiStore.sidebarCollapsed }">
    <Sidebar />
    <div
      class="sidebar-overlay"
      aria-hidden="true"
      @click="uiStore.toggleSidebarCollapse"
    />

    <div class="main-content">
      <Header />

      <main class="content-area">
        <slot />
      </main>
    </div>

    <button
      class="fab"
      type="button"
      @click="showQuickAdd = true"
      title="Быстрое добавление (Ctrl+K)"
      aria-label="Быстрое добавление заметки"
    >
      <Plus :size="24" />
    </button>

    <QuickAdd v-if="showQuickAdd" @close="showQuickAdd = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import QuickAdd from '@/components/features/QuickAdd.vue'
import { Plus } from 'lucide-vue-next'

const uiStore = useUIStore()
const showQuickAdd = ref(false)

const handleKeydown = (e) => {
  // Ctrl/Cmd + K для быстрого добавления
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showQuickAdd.value = !showQuickAdd.value
  }

  // Escape для закрытия
  if (e.key === 'Escape') {
    showQuickAdd.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--bg-page);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: var(--transition);
}

.content-area {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.sidebar-overlay {
  display: none;
}

.fab {
  position: fixed;
  right: calc(24px + var(--safe-right));
  bottom: calc(24px + var(--safe-bottom));
  width: 56px;
  height: 56px;
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  border-radius: 50%;
  border: none;
  background: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease);
  touch-action: manipulation;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.fab:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s var(--ease);
  }

  .main-layout.sidebar-open .sidebar-overlay {
    opacity: 1;
    pointer-events: auto;
  }

  .content-area {
    padding: 16px;
    padding-left: calc(16px + var(--safe-left));
    padding-right: calc(16px + var(--safe-right));
    padding-bottom: calc(16px + var(--safe-bottom));
  }

  .fab {
    right: calc(16px + var(--safe-right));
    bottom: calc(16px + var(--safe-bottom));
  }
}
</style>