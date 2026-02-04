<!-- frontend/src/components/layout/Sidebar.vue -->
<template>
  <aside class="sidebar" :class="{ 'collapsed': uiStore.sidebarCollapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <FileText :size="24" />
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

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" active-class="active">
        <Home :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Главная</span>
      </router-link>

      <router-link to="/notes" class="nav-item" active-class="active">
        <FileText :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Заметки</span>
        <span class="count" v-if="!uiStore.sidebarCollapsed && (dashboardStore.stats.notes?.total ?? 0) > 0">
          {{ dashboardStore.stats.notes?.total ?? 0 }}
        </span>
      </router-link>

      <router-link to="/favorites" class="nav-item" active-class="active">
        <Star :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Избранное</span>
        <span class="count" v-if="!uiStore.sidebarCollapsed && (dashboardStore.stats.favorites?.length ?? 0) > 0">
          {{ dashboardStore.stats.favorites?.length ?? 0 }}
        </span>
      </router-link>

      <router-link to="/todos" class="nav-item" active-class="active">
        <CheckSquare :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">TODO</span>
      </router-link>

      <router-link to="/search" class="nav-item" active-class="active">
        <Search :size="20" />
        <span v-if="!uiStore.sidebarCollapsed">Поиск</span>
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
          >
            <FileText :size="14" />
            <span class="sidebar-note-title">{{ note.title || 'Без названия' }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="sidebar-section sidebar-tags" v-if="!uiStore.sidebarCollapsed">
      <div class="section-header">
        <span>ТЕГИ</span>
      </div>
      <div class="tags-list" v-if="allTags.length">
        <router-link
            v-for="tag in allTags"
            :key="tag"
            :to="{ path: '/notes', query: { tag } }"
            class="sidebar-tag-link"
            :class="{ active: route.query.tag === tag }"
        >
          <Tag :size="14" />
          <span class="sidebar-tag-name">{{ tag }}</span>
        </router-link>
      </div>
      <div class="tags-empty" v-else>
        <span>Нет тегов</span>
      </div>
    </div>

    <div class="sidebar-section" v-if="!uiStore.sidebarCollapsed">
      <div class="section-header">
        <span>ПАПКИ</span>
        <button
            class="btn btn-icon-sm btn-ghost"
            @click="openFolderModal"
            title="Создать папку"
        >
          <Plus :size="16" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useFoldersStore } from '@/stores/folders'
import { useDashboardStore } from '@/stores/dashboard'
import FolderTreeItem from '@/components/features/FolderTreeItem.vue'
import FolderModal from '@/components/features/FolderModal.vue'
import {
  Home,
  FileText,
  Star,
  Pin,
  Tag,
  CheckSquare,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HardDrive
} from 'lucide-vue-next'

const SIDEBAR_PINNED_KEY = 'sidebar-pinned-expanded'
const SIDEBAR_FAVORITES_KEY = 'sidebar-favorites-expanded'

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

watch(pinnedExpanded, (v) => {
  try { localStorage.setItem(SIDEBAR_PINNED_KEY, String(v)) } catch {}
})
watch(favoritesExpanded, (v) => {
  try { localStorage.setItem(SIDEBAR_FAVORITES_KEY, String(v)) } catch {}
})

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()
const foldersStore = useFoldersStore()
const dashboardStore = useDashboardStore()

const storageUsed = ref('0 MB')
const storageTotal = ref('1 GB')

const pinnedNotes = computed(() => Array.isArray(dashboardStore.stats.pinned) ? dashboardStore.stats.pinned : [])
const favoriteNotes = computed(() => Array.isArray(dashboardStore.stats.favorites) ? dashboardStore.stats.favorites : [])
const allTags = computed(() => Array.isArray(dashboardStore.stats.tags) ? dashboardStore.stats.tags : [])

// Флаг для предотвращения множественных переходов
const navigating = ref(false)

onMounted(async () => {
  await Promise.all([
    foldersStore.fetchFolderTree(),
    dashboardStore.fetchStats()
  ])
})

const openFolderModal = () => {
  uiStore.openModal(FolderModal)
}

const handleFolderSelect = (folderId) => {
  if (navigating.value) return
  navigating.value = true
  foldersStore.selectFolder(folderId)
  router.push(`/folder/${folderId}`).finally(() => {
    setTimeout(() => { navigating.value = false }, 200)
  })
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
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

.logo svg {
  flex-shrink: 0;
  opacity: 0.95;
}

.collapse-btn {
  flex-shrink: 0;
  border-radius: var(--radius-sm);
}

.sidebar-nav {
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: var(--nav-item-h);
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
  padding: 3px 8px;
  background: var(--surface-raised);
  border-radius: 999px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.nav-item.active .count {
  background: var(--primary-soft-hover);
  color: var(--primary);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
}

.sidebar-section {
  overflow-y: auto;
  padding: 8px 8px 12px;
}

.sidebar-section.sidebar-notes-list {
  flex: 0 0 auto;
  max-height: 200px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-section:not(.sidebar-notes-list):not(.sidebar-tags) {
  flex: 1;
}

.sidebar-section.sidebar-tags {
  flex: 0 0 auto;
  max-height: 180px;
  overflow-y: auto;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
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
  margin-bottom: 10px;
}

.notes-list-block:last-child {
  margin-bottom: 0;
}

.notes-list-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.notes-list-title svg {
  flex-shrink: 0;
  opacity: 0.9;
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
}
</style>