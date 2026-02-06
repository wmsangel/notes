<!-- frontend/src/components/features/TiptapEditor.vue -->
<template>
  <div class="tiptap-editor">
    <div class="editor-toolbar" v-if="editor">
      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('bold') }"
            @click="editor.chain().focus().toggleBold().run()"
            title="Жирный (Ctrl+B)"
        >
          <Bold :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('italic') }"
            @click="editor.chain().focus().toggleItalic().run()"
            title="Курсив (Ctrl+I)"
        >
          <Italic :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('underline') }"
            @click="editor.chain().focus().toggleUnderline().run()"
            title="Подчеркнутый (Ctrl+U)"
        >
          <UnderlineIcon :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('strike') }"
            @click="editor.chain().focus().toggleStrike().run()"
            title="Зачеркнутый"
        >
          <Strikethrough :size="18" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
            title="Заголовок 1"
        >
          <Heading1 :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
            title="Заголовок 2"
        >
          <Heading2 :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
            title="Заголовок 3"
        >
          <Heading3 :size="18" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('bulletList') }"
            @click="editor.chain().focus().toggleBulletList().run()"
            title="Маркированный список"
        >
          <List :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('orderedList') }"
            @click="editor.chain().focus().toggleOrderedList().run()"
            title="Нумерованный список"
        >
          <ListOrdered :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('taskList') }"
            @click="editor.chain().focus().toggleTaskList().run()"
            title="Список задач (чекбоксы)"
        >
          <ListChecks :size="18" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('blockquote') }"
            @click="editor.chain().focus().toggleBlockquote().run()"
            title="Цитата"
        >
          <Quote :size="18" />
        </button>

        <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('codeBlock') }"
            @click="editor.chain().focus().toggleCodeBlock().run()"
            title="Блок кода"
        >
          <Code :size="18" />
        </button>

        <button
            class="toolbar-btn"
            @click="addLink"
            :class="{ 'is-active': editor.isActive('link') }"
            title="Ссылка"
        >
          <LinkIcon :size="18" />
        </button>

        <div class="toolbar-note-link-wrap">
          <button
              type="button"
              class="toolbar-btn toolbar-btn-note-link"
              :class="{ 'is-active': showNoteLinkPicker }"
              @click="toggleNoteLinkPicker"
              title="Ссылка на заметку"
          >
            <Link2 :size="18" />
            <span class="toolbar-btn-label">На заметку</span>
          </button>
          <Transition name="fade">
            <div v-if="showNoteLinkPicker" class="note-link-picker card">
              <input
                  v-model="noteLinkSearch"
                  type="text"
                  class="input note-link-search"
                  placeholder="Поиск заметки..."
              />
              <div class="note-link-list">
                <button
                    v-for="n in filteredNotesForLink"
                    :key="n.id"
                    type="button"
                    class="note-link-item"
                    @click="insertNoteLink(n)"
                >
                  <FileText :size="16" />
                  <span class="note-link-title">{{ n.title || 'Без названия' }}</span>
                </button>
                <p v-if="!filteredNotesForLink.length" class="note-link-empty">Нет заметок</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Кнопка загрузки изображения -->
        <button
            class="toolbar-btn"
            @click="triggerImageUpload"
            title="Вставить изображение"
        >
          <ImageIcon :size="18" />
        </button>
        <input
            ref="imageInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageUpload"
        />
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            @click="editor.chain().focus().setTextAlign('left').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
            title="По левому краю"
        >
          <AlignLeft :size="18" />
        </button>

        <button
            class="toolbar-btn"
            @click="editor.chain().focus().setTextAlign('center').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
            title="По центру"
        >
          <AlignCenter :size="18" />
        </button>

        <button
            class="toolbar-btn"
            @click="editor.chain().focus().setTextAlign('right').run()"
            :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
            title="По правому краю"
        >
          <AlignRight :size="18" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
            class="toolbar-btn"
            @click="editor.chain().focus().setHorizontalRule().run()"
            title="Горизонтальная линия"
        >
          <Minus :size="18" />
        </button>

        <button
            class="toolbar-btn"
            @click="editor.chain().focus().undo().run()"
            :disabled="!editor.can().undo()"
            title="Отменить (Ctrl+Z)"
        >
          <Undo :size="18" />
        </button>

        <button
            class="toolbar-btn"
            @click="editor.chain().focus().redo().run()"
            :disabled="!editor.can().redo()"
            title="Повторить (Ctrl+Shift+Z)"
        >
          <Redo :size="18" />
        </button>
      </div>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { useNotesStore } from '@/stores/notes'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import ImageResize from 'tiptap-extension-resize-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Link as LinkIcon,
  Link2,
  Image as ImageIcon,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo
} from 'lucide-vue-next'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  currentNoteId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update', 'image-upload'])

const router = useRouter()
const notesStore = useNotesStore()
const imageInput = ref(null)
const showNoteLinkPicker = ref(false)
const noteLinkSearch = ref('')

const filteredNotesForLink = computed(() => {
  const list = notesStore.notes || []
  const excludeId = props.currentNoteId != null ? String(props.currentNoteId) : null
  const q = (noteLinkSearch.value || '').trim().toLowerCase()
  return list
    .filter(n => String(n.id) !== excludeId)
    .filter(n => !q || (n.title || '').toLowerCase().includes(q))
})

const toggleNoteLinkPicker = async () => {
  showNoteLinkPicker.value = !showNoteLinkPicker.value
  if (showNoteLinkPicker.value) {
    noteLinkSearch.value = ''
    await notesStore.fetchNotes()
  }
}

const insertNoteLink = (n) => {
  if (!editor.value) return
  const href = `/notes/${n.id}`
  const text = n.title?.trim() || 'Без названия'
  editor.value.chain().focus().insertContent(`<a href="${href}">${escapeHtml(text)}</a>`).run()
  showNoteLinkPicker.value = false
}

function escapeHtml (str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Placeholder.configure({
      placeholder: 'Начните писать...'
    }),
    ImageResize.configure({
      inline: false,
      allowBase64: true,
      minWidth: 80,
      maxWidth: 800
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    }),
    TaskList,
    TaskItem.configure({
      nested: true
    })
  ],
  content: props.content,
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none'
    },
    handleClick: (view, event) => {
      const target = event.target
      if (target?.tagName !== 'A') return
      const href = target.getAttribute('href')
      if (!href?.startsWith('/notes/')) return
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        window.open(href, '_blank', 'noopener,noreferrer')
      } else {
        router.push(href)
      }
    },
    handleDrop: (view, event) => {
      const files = event.dataTransfer?.files
      if (files?.length) {
        const file = Array.from(files).find(f => f.type.startsWith('image/'))
        if (file) {
          event.preventDefault()
          insertImageFile(file)
          return true
        }
      }
    },
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items
      if (items) {
        const file = Array.from(items).find(item => item.type.startsWith('image/'))?.getAsFile()
        if (file) {
          event.preventDefault()
          insertImageFile(file)
          return true
        }
      }
    }
  },
  onUpdate: ({ editor }) => {
    emit('update', editor.getHTML())
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

watch(() => props.content, (newContent) => {
  const isSame = editor.value?.getHTML() === newContent
  if (newContent && !isSame) {
    editor.value?.commands.setContent(newContent, false)
  }
})

const addLink = () => {
  const url = prompt('Введите URL:')

  if (url && editor.value) {
    editor.value
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
  }
}

const insertImageFile = (file) => {
  if (!file || !editor.value) return
  if (file.size > 5 * 1024 * 1024) {
    alert('Файл слишком большой. Максимум 5MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result
    if (base64) {
      editor.value.chain().focus().setImage({ src: base64 }).run()
    }
  }
  reader.readAsDataURL(file)
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  insertImageFile(file)
  event.target.value = ''
  emit('image-upload', file)
}
</script>

<style scoped>
.tiptap-editor {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  flex-wrap: wrap;
  touch-action: manipulation;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  touch-action: manipulation;
  flex-shrink: 0;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg);
  color: var(--text);
}

.toolbar-btn.is-active {
  background: var(--primary);
  color: white;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-note-link-wrap {
  position: relative;
  flex-shrink: 0;
}

.toolbar-btn-note-link {
  min-width: auto;
  width: auto;
  padding: 0 10px;
  gap: 6px;
}

.toolbar-btn-label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.note-link-picker {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  min-width: 260px;
  max-width: 320px;
  max-height: 280px;
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}

.note-link-search {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.note-link-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
}

.note-link-item:hover {
  background: var(--bg-tertiary);
}

.note-link-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-link-empty {
  margin: 0;
  padding: 12px;
  font-size: 14px;
  color: var(--text-tertiary);
}

.editor-content {
  min-height: 400px;
}

.editor-content :deep(.ProseMirror) {
  -webkit-user-select: text;
  user-select: text;
  /* Чтобы клик в любой точке области редактора ставил курсор, а не попадал в пустое место */
  min-height: 100%;
  min-height: 400px;
}

:deep(.ProseMirror) {
  outline: none;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text);
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-tertiary);
  pointer-events: none;
  height: 0;
}

:deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 1em 0 0.5em;
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 700;
  margin: 0.8em 0 0.4em;
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  line-height: 1.4;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.ProseMirror ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
  margin: 1em 0;
  padding: 12px 16px;
  background: var(--surface-raised);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

:deep(.ProseMirror ul[data-type="taskList"] li) {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
  min-height: 28px;
}

:deep(.ProseMirror ul[data-type="taskList"] li:not(:last-child)) {
  border-bottom: 1px solid var(--border-subtle);
}

:deep(.ProseMirror ul[data-type="taskList"] li input[type="checkbox"]) {
  margin-top: 0.35em;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

:deep(.ProseMirror ul[data-type="taskList"] li[data-checked="true"]) {
  color: var(--text-tertiary);
  text-decoration: line-through;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
  color: var(--text-secondary);
}

:deep(.ProseMirror code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

:deep(.ProseMirror pre) {
  background: var(--bg-tertiary);
  padding: 1em;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 1em 0;
}

:deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-size: 0.9em;
}

:deep(.ProseMirror a) {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}

:deep(.ProseMirror a:hover) {
  color: var(--primary-dark);
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin: 1em 0;
  display: block;
}

:deep(.ProseMirror [data-type="imageResize"]),
:deep(.ProseMirror figure) {
  display: block;
  clear: both;
  margin: 1em 0;
}

:deep(.ProseMirror [data-type="imageResize"] > div),
:deep(.ProseMirror .image-resizer) {
  display: block !important;
  float: none !important;
}

:deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid var(--border);
  margin: 2em 0;
}

@media (max-width: 768px) {
  .tiptap-editor {
    padding-bottom: var(--safe-bottom);
  }

  .editor-toolbar {
    gap: 6px;
    padding: 10px;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    margin-left: calc(-1 * var(--safe-left));
    margin-right: calc(-1 * var(--safe-right));
    padding-left: calc(10px + var(--safe-left));
    padding-right: calc(10px + var(--safe-right));
  }

  .editor-toolbar::-webkit-scrollbar {
    display: none;
  }

  .toolbar-btn {
    width: var(--touch-min);
    height: var(--touch-min);
    min-width: var(--touch-min);
    min-height: var(--touch-min);
  }

  .toolbar-btn-note-link {
    min-width: var(--touch-min);
    width: var(--touch-min);
    padding: 0;
  }

  .toolbar-btn-label {
    display: none;
  }

  .toolbar-divider {
    flex-shrink: 0;
  }

  .editor-content {
    min-height: 50vh;
    min-height: 50dvh;
  }

  .editor-content :deep(.ProseMirror) {
    min-height: 50vh;
    min-height: 50dvh;
  }
}
</style>