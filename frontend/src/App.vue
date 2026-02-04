<!-- frontend/src/App.vue -->
<template>
  <div id="app" :class="{ 'sidebar-collapsed': uiStore.sidebarCollapsed }">
    <Toast />
    <Modal />
    <router-view :key="route.fullPath" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import Toast from '@/components/ui/Toast.vue'
import Modal from '@/components/ui/Modal.vue'

const route = useRoute()
const uiStore = useUIStore()
const { initTheme } = useTheme()

onMounted(() => {
  initTheme() // Инициализируем тему

  const collapsed = localStorage.getItem('sidebarCollapsed')
  if (collapsed === 'true') {
    uiStore.sidebarCollapsed = true
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>