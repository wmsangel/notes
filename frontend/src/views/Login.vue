<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">Вход</h1>
      <p class="login-subtitle">Введите пароль для доступа</p>

      <input
        v-model="password"
        type="password"
        class="input"
        placeholder="Пароль"
        @keydown.enter="submit"
      />

      <button class="btn btn-primary login-btn" @click="submit" :disabled="loading">
        Войти
      </button>

      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api/auth'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  if (!password.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    await authApi.login(password.value.trim())
    router.replace('/')
  } catch (e) {
    error.value = 'Неверный пароль'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-page);
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.login-subtitle {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.login-btn {
  width: 100%;
}

.login-error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}
</style>
