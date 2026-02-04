<!-- frontend/src/components/features/NoteCard.vue -->
<template>
  <div class="note-card card card-hover" @click="openNote">
    <div class="note-card-header">
      <h3 class="note-title">
        <Lock v-if="note.is_protected" :size="14" class="note-title-lock" title="Защищена паролем" />
        <span class="note-title-text">{{ note.title || 'Без названия' }}</span>
      </h3>

      <div class="note-actions" @click.stop>
        <button
            class="btn btn-icon-sm btn-ghost"
            @click="toggleFavorite"
            :title="note.is_favorite ? 'Удалить из избранного' : 'Добавить в избранное'"
        >
          <Star :size="16" :fill="note.is_favorite ? 'currentColor' : 'none'" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click="togglePin"
            :title="note.is_pinned ? 'Открепить' : 'Закрепить'"
        >
          <Pin :size="16" :fill="note.is_pinned ? 'currentColor' : 'none'" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click="deleteNote"
            title="Удалить"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <div class="note-content" v-if="contentPreview">
      {{ contentPreview }}
    </div>

    <div class="note-footer" v-if="note.tags && note.tags.length">
      <div class="note-tags">
        <span
            v-for="tag in note.tags.slice(0, 3)"
            :key="tag"
            class="tag"
        >
          {{ tag }}
        </span>
        <span v-if="note.tags.length > 3" class="tag-more">
          +{{ note.tags.length - 3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes'
import { useDashboardStore } from '@/stores/dashboard'
import { Star, Pin, Trash2, Lock } from 'lucide-vue-next'

const props = defineProps({
  note: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const router = useRouter()
const notesStore = useNotesStore()
const dashboardStore = useDashboardStore()

const contentPreview = computed(() => {
  if (!props.note.content) return ''

  // Удаляем HTML теги и берем первые 150 символов
  const text = props.note.content.replace(/<[^>]*>/g, '').trim()
  return text.length > 150 ? text.substring(0, 150) + '...' : text
})

const openNote = () => {
  router.push(`/notes/${props.note.id}`)
}

const toggleFavorite = async () => {
  try {
    await notesStore.toggleFavorite(props.note.id)
    dashboardStore.fetchStats()
  } catch (error) {
    console.error('Error toggling favorite:', error)
  }
}

const togglePin = async () => {
  try {
    await notesStore.updateNote(props.note.id, {
      is_pinned: !props.note.is_pinned
    })
    dashboardStore.fetchStats()
  } catch (error) {
    console.error('Error toggling pin:', error)
  }
}

const deleteNote = () => {
  emit('delete', props.note.id)
}
</script>

<style scoped>
.note-card {
  padding: 16px 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
  border-radius: var(--radius);
}

.note-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.note-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.note-title-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-width: 0;
}

.note-title-lock {
  flex-shrink: 0;
  color: var(--text-tertiary);
  opacity: 0.9;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.note-card:hover .note-actions {
  opacity: 1;
}

.note-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  /* На мобилке делаем карточки компактнее */
  .note-content {
    display: none;
  }

  .note-card {
    min-height: unset;
  }
}

.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.tag {
  padding: 5px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.tag-more {
  padding: 5px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}
</style>