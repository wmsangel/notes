<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-brand">
        <img src="/logo.svg" alt="IZN Notes" class="login-logo" />
        <div class="login-brand-text">Notes/Todo</div>
      </div>
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

      <div class="login-ad-wrap">
        <div ref="adContainer"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api/auth'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')
const adContainer = ref(null)

onMounted(() => {
  const container = adContainer.value
  if (!container) return

  const ins = document.createElement('ins')
  ins.className = 'asm_async_creative'
  ins.style.cssText = 'display:inline-block;width:246px;height:369px;text-align:left;text-decoration:none;'
  ins.setAttribute('data-asm-cdn', 'cdn.adspirit.de')
  ins.setAttribute('data-asm-host', 'bmm.adspirit.de')
  ins.setAttribute('data-asm-params', 'pid=45')
  container.appendChild(ins)

  if (!document.getElementById('adspirit-async-script')) {
    const script = document.createElement('script')
    script.id = 'adspirit-async-script'
    script.src = 'https://cdn.adspirit.de/adasync.min.js'
    script.type = 'text/javascript'
    document.body.appendChild(script)
  }
})

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

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.login-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  box-shadow: var(--shadow-xs);
}

.login-brand-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
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

.login-ad-wrap {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}
</style>
