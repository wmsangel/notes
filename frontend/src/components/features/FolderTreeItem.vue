<!-- frontend/src/components/features/FolderTreeItem.vue -->
<template>
  <div class="folder-tree-item">
    <div
        class="folder-item"
        :class="{
        'active': isActive,
        'has-children': hasChildren
      }"
        @click="handleClick"
    >
      <button
          v-if="hasChildren"
          class="expand-btn"
          @click.stop="toggleExpand"
      >
        <ChevronRight :size="16" :class="{ 'rotated': isExpanded }" />
      </button>

      <div class="folder-icon" :style="{ color: folder.color }">
        <Folder :size="18" />
      </div>

      <span class="folder-name">{{ folder.name }}</span>

      <div class="folder-actions" ref="actionsRef">
        <button
            type="button"
            class="btn btn-icon-sm btn-ghost folder-menu-btn"
            @click.stop="toggleMenu"
            title="Действия"
            aria-haspopup="true"
            :aria-expanded="menuOpen"
        >
          <MoreVertical :size="16" />
        </button>
        <Transition name="dropdown">
          <div v-if="menuOpen" class="folder-dropdown card" @click.stop>
            <button type="button" class="dropdown-item" @click="onAddSubfolder">
              <Plus :size="14" />
              Добавить подпапку
            </button>
            <button type="button" class="dropdown-item" @click="onEdit">
              <Edit2 :size="14" />
              Редактировать
            </button>
            <button type="button" class="dropdown-item dropdown-item--danger" @click="onDelete">
              <Trash2 :size="14" />
              Удалить
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <Transition name="expand">
      <div v-if="isExpanded && hasChildren" class="folder-children">
        <FolderTreeItem
            v-for="child in folder.children"
            :key="child.id"
            :folder="child"
            @select="(id) => $emit('select', id)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import { Folder, ChevronRight, Plus, Edit2, Trash2, MoreVertical } from 'lucide-vue-next'
import FolderModal from './FolderModal.vue'

const props = defineProps({
  folder: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const route = useRoute()
const foldersStore = useFoldersStore()
const uiStore = useUIStore()

const isExpanded = ref(false)
const menuOpen = ref(false)
const actionsRef = ref(null)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const onAddSubfolder = () => {
  closeMenu()
  handleAddSubfolder()
}

const onEdit = () => {
  closeMenu()
  handleEdit()
}

const onDelete = () => {
  closeMenu()
  handleDelete()
}

const handleClickOutside = (e) => {
  if (actionsRef.value && !actionsRef.value.contains(e.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const hasChildren = computed(() => {
  return props.folder.children && props.folder.children.length > 0
})

function branchContainsId(node, id) {
  if (!node) return false
  if (String(node.id) === String(id)) return true
  if (!node.children) return false
  return node.children.some(child => branchContainsId(child, id))
}

const activeInBranch = computed(() => {
  const currentId = route.params.id
  if (!currentId || route.name !== 'Folder') return false
  return branchContainsId(props.folder, currentId)
})

const isActive = computed(() => {
  return route.params.id == props.folder.id || foldersStore.selectedFolderId == props.folder.id
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const emit = defineEmits(['select'])

const handleClick = () => {
  emit('select', props.folder.id)
}

onMounted(() => {
  if (activeInBranch.value) {
    isExpanded.value = true
  }
})

watch(activeInBranch, (val) => {
  if (val) {
    isExpanded.value = true
  }
})

const handleAddSubfolder = () => {
  uiStore.openModal(FolderModal, {
    parentId: props.folder.id
  })
}

const handleEdit = () => {
  uiStore.openModal(FolderModal, {
    folder: props.folder
  })
}

const handleDelete = async () => {
  if (!confirm(`Удалить папку "${props.folder.name}"?`)) {
    return
  }

  try {
    await foldersStore.deleteFolder(props.folder.id)
    uiStore.showSuccess('Папка удалена')
  } catch (error) {
    if (error.message.includes('subfolders')) {
      uiStore.showError('Нельзя удалить папку с подпапками')
    } else {
      uiStore.showError('Ошибка при удалении папки')
    }
  }
}
</script>

<style scoped>
.folder-tree-item {
  width: 100%;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.folder-item:hover {
  background: var(--bg-tertiary);
}

.folder-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
}

.expand-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  transition: var(--transition);
}

.expand-btn svg.rotated {
  transform: rotate(90deg);
}

.folder-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

@media (max-width: 768px) {
  .folder-name {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    word-break: break-word;
  }
}

.folder-actions {
  position: relative;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: var(--transition);
}

.folder-item:hover .folder-actions {
  opacity: 1;
}

.folder-menu-btn {
  padding: 4px;
}

.folder-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 180px;
  padding: 6px 0;
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
}

.dropdown-item--danger {
  color: var(--danger);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.folder-children {
  margin-left: 20px;
  padding-left: 12px;
  border-left: 1px solid var(--border-light);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>