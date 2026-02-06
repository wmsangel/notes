<!-- frontend/src/App.vue -->
<template>
  <div id="app" :class="{ 'sidebar-collapsed': uiStore.sidebarCollapsed }">
    <Toast />
    <Modal />
    <Transition name="fade">
      <div v-if="pageLoading" class="page-loader">
        <div class="page-loader-spinner"></div>
      </div>
    </Transition>
    <router-view :key="route.fullPath" />
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import Toast from '@/components/ui/Toast.vue'
import Modal from '@/components/ui/Modal.vue'

const route = useRoute()
const uiStore = useUIStore()
const { initTheme } = useTheme()
const pageLoading = ref(false)

onMounted(() => {
  initTheme() // Инициализируем тему

  const collapsed = localStorage.getItem('sidebarCollapsed')
  if (collapsed === 'true') {
    uiStore.sidebarCollapsed = true
  }
})

watch(() => route.fullPath, async (newPath, oldPath) => {
  if (!oldPath) return
  pageLoading.value = true
  await nextTick()
  setTimeout(() => {
    pageLoading.value = false
  }, 300)
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}

.page-loader {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}

.page-loader-spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
