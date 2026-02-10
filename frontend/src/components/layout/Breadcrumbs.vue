<!-- frontend/src/components/layout/Breadcrumbs.vue -->
<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li v-for="(crumb, index) in breadcrumbs" :key="index">
        <button
          v-if="crumb.to"
          type="button"
          class="crumb-link"
          @click="router.push(crumb.to)"
        >
          {{ crumb.label }}
        </button>
        <span v-else class="crumb-current">{{ crumb.label }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="crumb-sep">/</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import { useNotesStore } from '@/stores/notes'

const route = useRoute()
const router = useRouter()
const foldersStore = useFoldersStore()
const notesStore = useNotesStore()

const BASE = { label: 'Главная', to: '/' }

onMounted(() => {
  if (!foldersStore.folders.length) {
    foldersStore.fetchFolders()
  }
})

function folderPathCrumbs(folderId) {
  const path = foldersStore.getFolderPath(Number(folderId))
  if (!path.length) return []
  return path.map((folder, idx) => ({
    label: folder.name,
    to: idx === path.length - 1 ? null : `/folder/${folder.id}`
  }))
}

const breadcrumbs = computed(() => {
  const name = route.name
  if (name === 'Dashboard') return [{ label: 'Главная', to: null }]

  const crumbs = [BASE]

  if (name === 'Folder') {
    const folderCrumbs = folderPathCrumbs(route.params.id)
    if (folderCrumbs.length) return crumbs.concat(folderCrumbs)
    return crumbs.concat([{ label: 'Папка', to: null }])
  }

  if (name === 'NoteView') {
    const noteId = Number(route.params.id)
    const note = notesStore.currentNote || notesStore.notes.find(n => n.id === noteId)
    if (note?.folder_id) {
      const path = folderPathCrumbs(note.folder_id)
      if (path.length) crumbs.push(...path)
    }
    const title = note?.title?.trim() || 'Заметка'
    crumbs.push({ label: title, to: null })
    return crumbs
  }

  const labelMap = {
    Notes: 'Заметки',
    Favorites: 'Избранное',
    Calendar: 'Календарь',
    Todos: 'Задачи',
    TodosOverview: 'Все задачи',
    TodoList: 'Список задач',
    Settings: 'Настройки',
    Search: 'Поиск',
    NotFound: '404'
  }

  const label = labelMap[name] || route.meta?.title || 'Раздел'
  crumbs.push({ label, to: null })
  return crumbs
})
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.breadcrumbs ol {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.breadcrumbs li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.crumb-link,
.crumb-current {
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 220px;
}

.crumb-link {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  transition: background 0.2s var(--ease), color 0.2s var(--ease);
}

.crumb-link:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.crumb-current {
  color: var(--text-primary);
  font-weight: 600;
}

.crumb-sep {
  color: var(--text-tertiary);
  font-size: 12px;
}

@media (max-width: 768px) {
  .crumb-link,
  .crumb-current {
    max-width: 140px;
  }
}
</style>
