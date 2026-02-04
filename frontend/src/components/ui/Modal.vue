<!-- frontend/src/components/ui/Modal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="uiStore.modalOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal" @click.stop>
          <component
              :is="uiStore.modalComponent"
              v-bind="uiStore.modalProps"
              @close="uiStore.closeModal"
              @created="handleModalCreated"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

const handleOverlayClick = () => {
  uiStore.closeModal()
}

const handleModalCreated = (payload) => {
  if (typeof uiStore.modalProps?.onCreated === 'function') {
    uiStore.modalProps.onCreated(payload)
  }
  uiStore.closeModal()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9998;
  backdrop-filter: blur(6px);
}

[data-theme="dark"] .modal-overlay {
  background: rgba(0, 0, 0, 0.6);
}

.modal {
  background: var(--surface-overlay);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-subtle);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96) translateY(-8px);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  }

  .modal {
    max-width: 100%;
    max-height: calc(100vh - var(--safe-top) - var(--safe-bottom));
    max-height: calc(100dvh - var(--safe-top) - var(--safe-bottom));
    border-radius: var(--radius-lg);
  }
}
</style>