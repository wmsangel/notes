<!-- frontend/src/components/layout/MainLayout.vue -->
<template>
  <div class="main-layout" :class="{ 'sidebar-open': !uiStore.sidebarCollapsed }" :style="layoutStyle">
    <Sidebar />
    <div
      class="sidebar-resizer"
      aria-hidden="true"
      @mousedown="startSidebarResize"
      @dblclick="toggleSidebarByHandle"
    />
    <div
      class="sidebar-overlay"
      aria-hidden="true"
      @click="uiStore.handleSidebarOverlayClick"
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

    <nav class="mobile-tabbar" aria-label="Мобильная навигация">
      <button type="button" class="mobile-tabbar-item" :class="{ active: route.path === '/' }" @click="router.push('/')">
        <Home :size="20" />
        <span>Главная</span>
      </button>
      <button type="button" class="mobile-tabbar-item" :class="{ active: route.path.startsWith('/notes') }" @click="router.push('/notes')">
        <FileText :size="20" />
        <span>Заметки</span>
      </button>
      <div class="mobile-tabbar-gap" aria-hidden="true"></div>
      <button type="button" class="mobile-tabbar-item" :class="{ active: route.path.startsWith('/todos') }" @click="router.push('/todos-overview')">
        <CheckSquare :size="20" />
        <span>Задачи</span>
      </button>
      <button type="button" class="mobile-tabbar-item" :class="{ active: route.path.startsWith('/calendar') }" @click="router.push('/calendar')">
        <Calendar :size="20" />
        <span>Календарь</span>
      </button>
    </nav>

    <QuickAdd v-if="showQuickAdd" @close="showQuickAdd = false" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import QuickAdd from '@/components/features/QuickAdd.vue'
import { Plus, Home, FileText, CheckSquare, Calendar } from 'lucide-vue-next'

const uiStore = useUIStore()
const route = useRoute()
const router = useRouter()
const showQuickAdd = ref(false)
const isResizingSidebar = ref(false)
const layoutStyle = computed(() => ({
  '--sidebar-width': `${uiStore.sidebarCollapsed ? 64 : uiStore.sidebarWidth}px`
}))

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
  stopSidebarResize()
})

const onSidebarResize = (event) => {
  if (!isResizingSidebar.value) return
  uiStore.setSidebarCollapsed(false)
  uiStore.setSidebarWidth(event.clientX)
}

const stopSidebarResize = () => {
  isResizingSidebar.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onSidebarResize)
  window.removeEventListener('mouseup', stopSidebarResize)
}

const startSidebarResize = (event) => {
  if (window.innerWidth <= 768) return
  event.preventDefault()
  isResizingSidebar.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onSidebarResize)
  window.addEventListener('mouseup', stopSidebarResize)
}

const toggleSidebarByHandle = () => {
  if (window.innerWidth <= 768) return
  uiStore.toggleSidebarCollapse()
}
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--bg-page);
  overflow: hidden; /* чтобы скроллилась только правая часть */
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: var(--transition);
}

.sidebar-resizer {
  width: 10px;
  margin-left: -5px;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
}

.sidebar-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4px;
  width: 2px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s var(--ease);
}

.sidebar-resizer:hover::before {
  background: var(--border);
}

.content-area {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  min-height: 0; /* важно для корректного flex-scroll */
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

.mobile-tabbar {
  display: none;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.fab:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .sidebar-resizer {
    display: none;
  }

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
    padding-bottom: calc(92px + var(--safe-bottom));
  }

  .fab {
    right: 50%;
    bottom: calc(54px + var(--safe-bottom));
    transform: translateX(50%);
  }

  .fab:hover {
    transform: translateX(50%) scale(1.05);
  }

  .fab:active {
    transform: translateX(50%) scale(0.98);
  }

  .mobile-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 45;
    display: grid;
    grid-template-columns: 1fr 1fr 72px 1fr 1fr;
    align-items: end;
    padding: 10px calc(12px + var(--safe-right)) calc(10px + var(--safe-bottom)) calc(12px + var(--safe-left));
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    border-top: 1px solid var(--border-subtle);
    backdrop-filter: blur(12px);
  }

  .mobile-tabbar-item {
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 48px;
    font: inherit;
  }

  .mobile-tabbar-item span {
    font-size: 11px;
    font-weight: 600;
  }

  .mobile-tabbar-item.active {
    color: var(--primary);
  }

  .mobile-tabbar-gap {
    height: 1px;
  }
}
</style>
