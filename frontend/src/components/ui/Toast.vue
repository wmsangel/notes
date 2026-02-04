<!-- frontend/src/components/ui/Toast.vue -->
<template>
  <Transition name="toast">
    <div
        v-if="uiStore.toast.show"
        class="toast"
        :class="`toast-${uiStore.toast.type}`"
    >
      <div class="toast-icon">
        <CheckCircle v-if="uiStore.toast.type === 'success'" :size="20" />
        <AlertCircle v-if="uiStore.toast.type === 'error'" :size="20" />
        <AlertTriangle v-if="uiStore.toast.type === 'warning'" :size="20" />
        <Info v-if="uiStore.toast.type === 'info'" :size="20" />
      </div>

      <div class="toast-content">
        <p class="toast-message">{{ uiStore.toast.message }}</p>
      </div>

      <button class="toast-close" @click="uiStore.hideToast">
        <X :size="16" />
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const uiStore = useUIStore()
</script>

<style scoped>
.toast {
  position: fixed;
  top: calc(20px + var(--safe-top));
  right: calc(20px + var(--safe-right));
  left: calc(20px + var(--safe-left));
  min-width: 280px;
  max-width: 480px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  z-index: 9999;
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.toast-success {
  border-left: 4px solid var(--success);
}

.toast-success .toast-icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.toast-error {
  border-left: 4px solid var(--danger);
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.toast-info {
  border-left: 4px solid var(--primary);
}

.toast-info .toast-icon {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  margin: 0;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: var(--transition);
}

.toast-close:hover {
  background: var(--bg-tertiary);
  color: var(--text);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@media (max-width: 768px) {
  .toast {
    top: calc(10px + var(--safe-top));
    right: calc(10px + var(--safe-right));
    left: calc(10px + var(--safe-left));
    min-width: auto;
  }
}
</style>