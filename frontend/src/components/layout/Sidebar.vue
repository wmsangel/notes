<!-- frontend/src/components/layout/Sidebar.vue -->
<template>
  <aside
    class="sidebar"
    :class="{ 'collapsed': uiStore.sidebarCollapsed }"
    @pointerdown="uiStore.ignoreNextOverlayClick()"
  >
    <div class="sidebar-header">
      <div class="logo">
        <img src="/logo.svg" alt="IZN Notes" class="logo-mark" />
        <span v-if="!uiStore.sidebarCollapsed">Notes</span>
      </div>

      <button
          class="btn btn-icon-sm btn-ghost collapse-btn"
          @click="uiStore.toggleSidebarCollapse"
          :title="uiStore.sidebarCollapsed ? 'Развернуть' : 'Свернуть'"
      >
        <ChevronLeft :size="18" v-if="!uiStore.sidebarCollapsed" />
        <ChevronRight :size="18" v-else />
      </button>
    </div>

    <div v-if="!uiStore.sidebarCollapsed" class="sidebar-search">
      <div class="sidebar-search-field" :class="{ 'is-active': quickFindActive }">
        <Search :size="16" class="sidebar-search-icon" />
        <input
          ref="quickFindInput"
          v-model="quickFindQuery"
          type="text"
          class="sidebar-search-input"
          placeholder="Поиск..."
          @focus="handleQuickFindFocus"
          @keydown.esc="clearQuickFind"
        />
        <button
          v-if="quickFindQuery"
          type="button"
          class="sidebar-search-clear"
          @click="clearQuickFind"
        >
          ×
        </button>
        <span v-else class="sidebar-search-shortcut">/</span>
      </div>

      <div v-if="quickFindActive" class="quick-find card">
        <div class="quick-find-header">
          <span>Быстрый поиск</span>
          <span class="quick-find-shortcut">/</span>
        </div>
        <div v-if="quickFindResults.length" class="quick-find-list">
          <button
            v-for="item in quickFindResults"
            :key="`${item.type}-${item.id}`"
            type="button"
            class="quick-find-item"
            :class="{ active: item.isActive }"
            @click="openQuickFindItem(item)"
          >
            <component :is="item.icon" :size="16" />
            <span class="quick-find-label">{{ item.title }}</span>
            <span class="quick-find-type">{{ item.typeLabel }}</span>
          </button>
        </div>
        <div v-else class="quick-find-empty">Ничего не найдено</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
        <Home :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Главная</span>
      </router-link>

      <router-link to="/notes" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
        <FileText :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Заметки</span>
        <span class="count" v-if="!uiStore.sidebarCollapsed && (dashboardStore.stats.notes?.total ?? 0) > 0">
          {{ dashboardStore.stats.notes?.total ?? 0 }}
        </span>
      </router-link>

      <router-link to="/favorites" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
        <Star :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Избранное</span>
        <span class="count" v-if="!uiStore.sidebarCollapsed && (dashboardStore.stats.favorites?.length ?? 0) > 0">
          {{ dashboardStore.stats.favorites?.length ?? 0 }}
        </span>
      </router-link>

      <router-link to="/calendar" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
        <Calendar :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Календарь</span>
      </router-link>

      <router-link to="/todos-overview" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
        <ListTodo :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Все задачи</span>
      </router-link>

    </nav>

    <div class="sidebar-section sidebar-notes-list" v-if="!uiStore.sidebarCollapsed && (pinnedNotes.length || favoriteNotes.length)">
      <div class="notes-list-block" v-if="pinnedNotes.length">
        <button
            type="button"
            class="notes-list-title notes-list-title--toggle"
            @click="pinnedExpanded = !pinnedExpanded"
            :title="pinnedExpanded ? 'Свернуть' : 'Развернуть'"
        >
          <ChevronDown :size="14" class="chevron" :class="{ 'chevron--collapsed': !pinnedExpanded }" />
          <Pin :size="14" />
          <span>Закреплённые</span>
        </button>
        <div class="notes-list-body" v-show="pinnedExpanded">
          <router-link
              v-for="note in pinnedNotes"
              :key="note.id"
              :to="`/notes/${note.id}`"
              class="sidebar-note-link"
              @click="closeSidebarOnMobile"
          >
            <FileText :size="14" />
            <span class="sidebar-note-title">{{ note.title || 'Без названия' }}</span>
          </router-link>
        </div>
      </div>
      <div class="notes-list-block" v-if="favoriteNotes.length">
        <button
            type="button"
            class="notes-list-title notes-list-title--toggle"
            @click="favoritesExpanded = !favoritesExpanded"
            :title="favoritesExpanded ? 'Свернуть' : 'Развернуть'"
        >
          <ChevronDown :size="14" class="chevron" :class="{ 'chevron--collapsed': !favoritesExpanded }" />
          <Star :size="14" />
          <span>Избранное</span>
        </button>
        <div class="notes-list-body" v-show="favoritesExpanded">
          <router-link
              v-for="note in favoriteNotes"
              :key="note.id"
              :to="`/notes/${note.id}`"
              class="sidebar-note-link"
              @click="closeSidebarOnMobile"
          >
            <FileText :size="14" />
            <span class="sidebar-note-title">{{ note.title || 'Без названия' }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="sidebar-section sidebar-tags" v-if="showTags && !uiStore.sidebarCollapsed">
      <button
          type="button"
          class="section-toggle"
          @click="tagsExpanded = !tagsExpanded"
          :title="tagsExpanded ? 'Свернуть' : 'Развернуть'"
      >
        <ChevronDown :size="14" class="chevron" :class="{ 'chevron--collapsed': !tagsExpanded }" />
        <Tag :size="14" class="section-icon" />
        <span>ТЕГИ</span>
        <span class="section-count" v-if="allTags.length">{{ allTags.length }}</span>
      </button>

      <div v-show="tagsExpanded">
        <div class="tags-list" v-if="allTags.length">
          <router-link
              v-for="tag in allTags"
              :key="tag"
              :to="{ path: '/notes', query: { tag } }"
              class="sidebar-tag-link"
              :class="{ active: route.query.tag === tag }"
              @click="closeSidebarOnMobile"
          >
            <Tag :size="14" />
            <span class="sidebar-tag-name">{{ tag }}</span>
          </router-link>
        </div>
        <div class="tags-empty" v-else>
          <span>Нет тегов</span>
        </div>
      </div>
    </div>

    <div class="sidebar-section sidebar-folders" v-if="!uiStore.sidebarCollapsed">
      <div class="section-header section-header--with-icon">
        <Folder :size="14" class="section-icon" />
        <span>ПАПКИ</span>
        <button
            class="btn btn-icon-sm btn-ghost section-header-btn"
            @click="openFolderModal"
            title="Создать папку"
        >
          <Plus :size="14" />
        </button>
      </div>

      <div class="folders-tree" v-if="foldersStore.folderTree.length">
        <FolderTreeItem
            v-for="folder in foldersStore.folderTree"
            :key="folder.id"
            :folder="folder"
            @select="handleFolderSelect"
        />
      </div>

      <div class="empty-folders" v-else>
        <p>Нет папок</p>
        <button class="btn btn-sm btn-ghost" @click="openFolderModal">
          <Plus :size="14" />
          Создать папку
        </button>
      </div>
    </div>

    <div class="sidebar-footer" v-if="!uiStore.sidebarCollapsed">
      <div class="storage-info">
        <HardDrive :size="16" />
        <div class="storage-text">
          <div class="storage-label">Хранилище</div>
          <div class="storage-value">{{ storageUsed }} / {{ storageTotal }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useFoldersStore } from '@/stores/folders'
import { useDashboardStore } from '@/stores/dashboard'
import { useNotesStore } from '@/stores/notes'
import { useTodosStore } from '@/stores/todos'
import FolderTreeItem from '@/components/features/FolderTreeItem.vue'
import FolderModal from '@/components/features/FolderModal.vue'
import {
  Home,
  FileText,
  Star,
  Pin,
  Tag,
  Folder,
  Plus,
  Calendar,
  ListTodo,
  Search,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HardDrive
} from 'lucide-vue-next'

const SIDEBAR_PINNED_KEY = 'sidebar-pinned-expanded'
const SIDEBAR_FAVORITES_KEY = 'sidebar-favorites-expanded'
const SIDEBAR_TAGS_KEY = 'sidebar-tags-expanded'

const pinnedExpanded = ref(
  (() => {
    try {
      const v = localStorage.getItem(SIDEBAR_PINNED_KEY)
      return v !== 'false'
    } catch {
      return true
    }
  })()
)
const favoritesExpanded = ref(
  (() => {
    try {
      const v = localStorage.getItem(SIDEBAR_FAVORITES_KEY)
      return v !== 'false'
    } catch {
      return true
    }
  })()
)

const tagsExpanded = ref(
  (() => {
    try {
      const v = localStorage.getItem(SIDEBAR_TAGS_KEY)
      return v !== 'false'
    } catch {
      return true
    }
  })()
)

watch(pinnedExpanded, (v) => {
  try { localStorage.setItem(SIDEBAR_PINNED_KEY, String(v)) } catch {}
})
watch(favoritesExpanded, (v) => {
  try { localStorage.setItem(SIDEBAR_FAVORITES_KEY, String(v)) } catch {}
})
watch(tagsExpanded, (v) => {
  try { localStorage.setItem(SIDEBAR_TAGS_KEY, String(v)) } catch {}
})

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()
const foldersStore = useFoldersStore()
const dashboardStore = useDashboardStore()
const notesStore = useNotesStore()
const todosStore = useTodosStore()
const showTags = ref(false)
const quickFindQuery = ref('')
const quickFindInput = ref(null)

const storageUsed = ref('0 MB')
const storageTotal = ref('1 GB')

const pinnedNotes = computed(() => Array.isArray(dashboardStore.stats.pinned) ? dashboardStore.stats.pinned : [])
const favoriteNotes = computed(() => Array.isArray(dashboardStore.stats.favorites) ? dashboardStore.stats.favorites : [])
const allTags = computed(() => Array.isArray(dashboardStore.stats.tags) ? dashboardStore.stats.tags : [])
const quickFindActive = computed(() => quickFindQuery.value.trim().length > 0)
const quickFindResults = computed(() => {
  const query = quickFindQuery.value.trim().toLowerCase()
  if (!query) return []

  const notes = (notesStore.notes || [])
    .filter((note) => (note.title || '').toLowerCase().includes(query))
    .slice(0, 4)
    .map((note) => ({
      id: note.id,
      type: 'note',
      typeLabel: 'Заметка',
      title: note.title || 'Без названия',
      icon: FileText,
      to: `/notes/${note.id}`,
      isActive: route.name === 'NoteView' && String(route.params.id) === String(note.id)
    }))

  const folders = (foldersStore.flatFolders || [])
    .filter((folder) => (folder.name || '').toLowerCase().includes(query))
    .slice(0, 3)
    .map((folder) => ({
      id: folder.id,
      type: 'folder',
      typeLabel: 'Папка',
      title: folder.name,
      icon: Folder,
      to: `/folder/${folder.id}`,
      isActive: route.name === 'Folder' && String(route.params.id) === String(folder.id)
    }))

  const todos = (todosStore.lists || [])
    .filter((list) => (list.title || '').toLowerCase().includes(query))
    .slice(0, 3)
    .map((list) => ({
      id: list.id,
      type: 'todo',
      typeLabel: 'Список',
      title: list.title,
      icon: CheckSquare,
      to: `/todos/${list.id}`,
      isActive: route.name === 'TodoList' && String(route.params.id) === String(list.id)
    }))

  return [...notes, ...folders, ...todos].slice(0, 8)
})

// Флаг для предотвращения множественных переходов
const navigating = ref(false)

onMounted(async () => {
  await Promise.all([
    foldersStore.fetchFolders(),
    foldersStore.fetchFolderTree(),
    dashboardStore.fetchStats(),
    notesStore.fetchNotes(),
    todosStore.fetchLists()
  ])
  window.addEventListener('keydown', handleGlobalQuickFind)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalQuickFind)
})

watch(() => uiStore.sidebarCollapsed, (collapsed) => {
  if (collapsed) quickFindQuery.value = ''
})

watch(() => route.fullPath, () => {
  quickFindQuery.value = ''
})

const openFolderModal = () => {
  uiStore.openModal(FolderModal)
}

const handleGlobalQuickFind = (event) => {
  if (uiStore.sidebarCollapsed || event.key !== '/') return
  const target = event.target
  const tagName = target?.tagName?.toLowerCase()
  const isTypingContext = target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)
  if (isTypingContext) return
  event.preventDefault()
  quickFindInput.value?.focus()
}

const handleQuickFindFocus = async () => {
  await Promise.all([
    foldersStore.folders.length ? Promise.resolve() : foldersStore.fetchFolders(),
    notesStore.notes.length ? Promise.resolve() : notesStore.fetchNotes(),
    todosStore.lists.length ? Promise.resolve() : todosStore.fetchLists()
  ])
}

const clearQuickFind = () => {
  quickFindQuery.value = ''
  quickFindInput.value?.blur()
}

const openQuickFindItem = (item) => {
  if (!item?.to) return
  router.push(item.to)
  closeSidebarOnMobile()
}

const handleFolderSelect = (folderId) => {
  // На мобилке, когда выбираем подпапку, игнорируем следующий клик по overlay,
  // чтобы меню не схлопывалось.
  uiStore.ignoreNextOverlayClick()
  if (navigating.value) return
  navigating.value = true
  foldersStore.selectFolder(folderId)
  router.push(`/folder/${folderId}`).finally(() => {
    setTimeout(() => { navigating.value = false }, 200)
    closeSidebarOnMobile()
  })
}

const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 768) {
    uiStore.sidebarCollapsed = true
  }
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: var(--surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width 0.25s var(--ease);
  overflow: hidden;
}

[data-theme="dark"] .sidebar {
  border-right-color: var(--border);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-search {
  padding: 10px 10px 6px;
  flex-shrink: 0;
}

.sidebar-search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-secondary);
  transition: var(--transition);
}

.sidebar-search-field.is-active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.sidebar-search-icon {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.sidebar-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  min-width: 0;
}

.sidebar-search-input:focus {
  outline: none;
}

.sidebar-search-shortcut,
.quick-find-shortcut {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.sidebar-search-clear {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.quick-find {
  margin-top: 10px;
  padding: 10px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.quick-find-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.quick-find-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-find-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.quick-find-item:hover,
.quick-find-item.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.quick-find-label {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-find-type {
  font-size: 11px;
  color: var(--text-tertiary);
}

.quick-find-empty {
  padding: 8px 4px 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.sidebar-header {
  height: var(--header-h);
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.02em;
}

.logo-mark {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 8px;
  box-shadow: var(--shadow-xs);
}

.logo svg {
  flex-shrink: 0;
  opacity: 0.95;
}

.collapse-btn {
  flex-shrink: 0;
  border-radius: var(--radius-sm);
}

.sidebar-nav {
  padding: 8px 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  height: 38px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  position: relative;
}

.nav-item:hover {
  background: var(--surface-raised);
  color: var(--text);
}

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.nav-item .count {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  background: var(--surface-raised);
  border-radius: 999px;
  color: var(--text-tertiary);
  font-weight: 700;
}

.nav-item.active .count {
  background: var(--primary-soft-hover);
  color: var(--primary);
}

.nav-item--button {
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

.sidebar-section {
  overflow-y: auto;
  padding: 10px 10px 12px;
}

.sidebar-section.sidebar-notes-list {
  flex: 0 0 auto;
  max-height: 200px;
  padding-bottom: 12px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-section:not(.sidebar-notes-list):not(.sidebar-tags):not(.sidebar-folders) {
  flex: 1;
}

.sidebar-section.sidebar-tags {
  flex: 0 0 auto;
  max-height: 180px;
  overflow-y: auto;
  padding-bottom: 12px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-section.sidebar-folders {
  flex: 1;
  padding-top: 12px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sidebar-tag-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-raised);
  transition: var(--transition);
}

.sidebar-tag-link:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.sidebar-tag-link.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.sidebar-tag-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tags-empty {
  padding: 8px 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.notes-list-block {
  margin-bottom: 8px;
}

.notes-list-block:last-child {
  margin-bottom: 0;
}

.notes-list-title,
.section-toggle,
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  min-height: 36px;
  box-sizing: border-box;
}

.notes-list-title svg,
.section-icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.section-header--with-icon {
  width: 100%;
}

.section-header-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.notes-list-title--toggle {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.notes-list-title--toggle:hover {
  color: var(--text-secondary);
  background: var(--surface-raised);
}

.notes-list-title--toggle .chevron {
  transition: transform 0.2s var(--ease);
}

.notes-list-title--toggle .chevron--collapsed {
  transform: rotate(-90deg);
}

.notes-list-body {
  display: flex;
  flex-direction: column;
}

.sidebar-note-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 13px;
  transition: var(--transition);
  margin-bottom: 1px;
}

.sidebar-note-link:hover {
  background: var(--surface-raised);
  color: var(--text);
}

.sidebar-note-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-toggle {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  border-radius: var(--radius-sm);
}

.section-toggle:hover {
  color: var(--text-secondary);
  background: var(--surface-raised);
}

.section-count {
  margin-left: auto;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: normal;
  text-transform: none;
  flex-shrink: 0;
}

.folders-tree {
  margin-top: 4px;
}

.folders-tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.empty-folders {
  padding: 16px 12px;
  text-align: center;
}

.empty-folders p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 10px 0;
}

.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--surface-raised);
  border-radius: var(--radius-sm);
}

.storage-info svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
  opacity: 0.8;
}

.storage-text {
  flex: 1;
  min-width: 0;
}

.storage-label {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-bottom: 1px;
  font-weight: 500;
}

.storage-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    width: min(300px, 85vw);
    transform: translateX(-100%);
    transition: transform 0.3s var(--ease);
    padding-left: var(--safe-left);
    padding-top: var(--safe-top);
    height: 100vh;
    height: 100dvh;
    max-height: -webkit-fill-available;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .sidebar-search {
    padding-top: 8px;
  }
}
</style>
