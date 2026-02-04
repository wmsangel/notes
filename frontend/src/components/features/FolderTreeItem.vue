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

      <div class="folder-actions">
        <button
            class="btn btn-icon-sm btn-ghost"
            @click.stop="handleAddSubfolder"
            title="Добавить подпапку"
        >
          <Plus :size="14" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click.stop="handleEdit"
            title="Редактировать"
        >
          <Edit2 :size="14" />
        </button>

        <button
            class="btn btn-icon-sm btn-ghost"
            @click.stop="handleDelete"
            title="Удалить"
        >
          <Trash2 :size="14" />
        </button>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFoldersStore } from '@/stores/folders'
import { useUIStore } from '@/stores/ui'
import { Folder, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-vue-next'
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

const hasChildren = computed(() => {
  return props.folder.children && props.folder.children.length > 0
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

.folder-item:hover .folder-actions {
  opacity: 1;
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
}

.folder-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: var(--transition);
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