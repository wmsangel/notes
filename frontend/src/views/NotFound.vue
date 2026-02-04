<!-- frontend/src/views/NotFound.vue -->
<template>
  <MainLayout>
    <div class="not-found">
      <FileQuestion :size="120" class="not-found-icon" />
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">Страница не найдена</h2>
      <p class="not-found-text">
        К сожалению, запрашиваемая страница не существует или была удалена.
      </p>
      <div class="not-found-actions">
        <router-link to="/" class="btn btn-primary">
          <Home :size="18" />
          На главную
        </router-link>
        <button class="btn btn-secondary" @click="goBack">
          <ArrowLeft :size="18" />
          Назад
        </button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { FileQuestion, Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 40px 20px;
}

.not-found-icon {
  color: var(--text-tertiary);
  opacity: 0.3;
  margin-bottom: 32px;
}

.not-found-title {
  font-size: 72px;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 16px 0;
  line-height: 1;
}

.not-found-subtitle {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 16px 0;
}

.not-found-text {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .not-found-icon {
    width: 80px;
    height: 80px;
  }

  .not-found-title {
    font-size: 56px;
  }

  .not-found-subtitle {
    font-size: 24px;
  }

  .not-found-text {
    font-size: 16px;
  }

  .not-found-actions {
    flex-direction: column;
    width: 100%;
  }

  .not-found-actions .btn {
    width: 100%;
  }
}
</style>