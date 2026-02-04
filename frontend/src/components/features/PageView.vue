<!-- Режим просмотра страницы: контент + ссылки на заметки как карточки -->
<template>
  <div class="page-view-readonly" @click="onContainerClick">
    <div
        class="page-view-content prose"
        v-html="sanitizedContent"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const router = useRouter()

const sanitizedContent = computed(() => {
  const html = props.content || ''
  if (!html.trim()) return ''
  return html
})

function onContainerClick(e) {
  const link = e.target.closest('a[href^="/notes/"]')
  if (link) {
    e.preventDefault()
    router.push(link.getAttribute('href'))
  }
}
</script>

<style scoped>
.page-view-readonly {
  min-height: 200px;
  padding: 24px 0;
}

.page-view-content {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text);
}

.page-view-content :deep(p) {
  margin: 0 0 1em 0;
}

.page-view-content :deep(p:last-child) {
  margin-bottom: 0;
}

.page-view-content :deep(h1) {
  font-size: 1.5em;
  margin: 1em 0 0.5em;
}

.page-view-content :deep(h2) {
  font-size: 1.25em;
  margin: 0.8em 0 0.4em;
}

.page-view-content :deep(h3) {
  font-size: 1.1em;
  margin: 0.6em 0 0.3em;
}

.page-view-content :deep(ul),
.page-view-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

/* Ссылки на заметки — как карточки */
.page-view-content :deep(a[href^="/notes/"]) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin: 6px 8px 6px 0;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.page-view-content :deep(a[href^="/notes/"]:hover) {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: var(--shadow-md);
}

.page-view-content :deep(a[href^="/notes/"]::before) {
  content: '';
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3Cpolyline points='10 9 9 9 8 9'/%3E%3C/svg%3E") no-repeat center;
  mask-size: contain;
  opacity: 0.9;
}

/* Обычные внешние ссылки */
.page-view-content :deep(a[href]:not([href^="/notes/"])) {
  color: var(--primary);
  text-decoration: underline;
}

.page-view-content :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--text-secondary);
}

.page-view-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}
</style>
