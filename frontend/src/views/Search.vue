<!-- frontend/src/views/Search.vue -->
<template>
  <MainLayout>
    <div class="search-page">
      <div class="search-header">
        <h1 class="page-title">
          <Search :size="32" />
          Поиск
        </h1>
      </div>

      <div class="search-box-large">
        <Search :size="24" class="search-icon" />
        <input
            ref="searchInput"
            type="text"
            class="search-input"
            v-model="query"
            @input="handleSearch"
            placeholder="Поиск по заметкам..."
            autofocus
        />
        <button
            v-if="query"
            class="btn btn-icon-sm btn-ghost clear-btn"
            @click="clearSearch"
        >
          <X :size="18" />
        </button>
      </div>

      <div v-if="searching" class="loading-state">
        <div class="spinner"></div>
        <p>Поиск...</p>
      </div>

      <div v-else-if="!query" class="empty-state">
        <Search :size="64" class="empty-icon" />
        <h2>Начните поиск</h2>
        <p>Введите запрос для поиска по заметкам</p>
      </div>

      <div v-else-if="!results.length" class="empty-state">
        <FileX :size="64" class="empty-icon" />
        <h2>Ничего не найдено</h2>
        <p>Попробуйте изменить поисковый запрос</p>
      </div>

      <div v-else class="search-results">
        <div class="results-header">
          <h2>Результаты поиска</h2>
          <span class="results-count">Найдено: {{ results.length }}</span>
        </div>

        <div class="results-list">
          <router-link
              v-for="note in results"
              :key="note.id"
              :to="`/notes/${note.id}`"
              class="result-item card"
          >
            <div class="result-header">
              <h3 class="result-title">{{ note.title }}</h3>
              <Star
                  v-if="note.is_favorite"
                  :size="16"
                  fill="currentColor"
                  class="favorite-icon"
              />
            </div>

            <p class="result-content" v-if="getContentPreview(note)">
              {{ getContentPreview(note) }}
            </p>

            <div class="result-footer">
              <div class="result-meta">
                <Clock :size="14" />
                <span>{{ formatDate(note.updated_at) }}</span>
              </div>

              <ChevronRight :size="16" class="result-arrow" />
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotesStore } from '@/stores/notes'
import MainLayout from '@/components/layout/MainLayout.vue'
import { Search, X, FileX, Star, Clock, ChevronRight } from 'lucide-vue-next'

const notesStore = useNotesStore()

const searchInput = ref(null)
const query = ref('')
const searching = ref(false)
const results = ref([])

let searchTimeout = null

onMounted(() => {
  searchInput.value?.focus()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)

  if (!query.value.trim()) {
    results.value = []
    return
  }

  searching.value = true

  searchTimeout = setTimeout(async () => {
    try {
      results.value = await notesStore.searchNotes(query.value)
    } catch (error) {
      console.error('Search error:', error)
      results.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const clearSearch = () => {
  query.value = ''
  results.value = []
  searchInput.value?.focus()
}

const getContentPreview = (note) => {
  if (!note.content) return ''

  const text = note.content.replace(/<[^>]*>/g, '').trim()
  return text.length > 200 ? text.substring(0, 200) + '...' : text
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дн. назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.search-page {
  max-width: 900px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box-large {
  position: relative;
  margin-bottom: 32px;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 18px 60px 18px 60px;
  font-size: 18px;
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg);
  color: var(--text);
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.loading-state p {
  margin-top: 16px;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
}

.results-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.results-count {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 20px;
  text-decoration: none;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: var(--transition);
}

.result-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.favorite-icon {
  color: var(--warning);
  flex-shrink: 0;
}

.result-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.result-arrow {
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .search-input {
    font-size: 16px;
    padding: 16px 50px 16px 50px;
  }
}
</style>