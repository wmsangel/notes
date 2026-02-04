<!-- frontend/src/components/ui/ModalBase.vue -->
<template>
  <div class="modal-base">
    <div class="modal-header">
      <h2 class="modal-title">{{ title }}</h2>
      <button class="btn btn-icon btn-ghost" @click="$emit('close')">
        <X :size="20" />
      </button>
    </div>

    <div class="modal-body">
      <slot />
    </div>

    <div class="modal-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped>
.modal-base {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
</style>