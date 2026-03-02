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

    <div v-if="showConsentBanner" class="consent-banner card">
      <div class="consent-title">Cookie & GDPR</div>
      <p class="consent-text">
        Чтобы показывать рекламу корректно, нужно выбрать согласие на обработку данных.
      </p>
      <div class="consent-actions">
        <button class="btn" @click="setConsent(false)">Отклонить</button>
        <button class="btn btn-primary" @click="setConsent(true)">Принять</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api/auth'
import { GVL, TCModel } from '@iabtcf/core'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')
const adContainer = ref(null)
const showConsentBanner = ref(false)
const TCF_STORAGE_KEY = 'tcf_consent_v1'

const tcfListeners = new Map()
let tcfListenerSeq = 1
let cmpConsentState = null

const createTcString = async (accepted) => {
  const gvl = new GVL()
  await gvl.readyPromise

  const tcModel = new TCModel(gvl)
  tcModel.cmpId = 300
  tcModel.cmpVersion = 1
  tcModel.consentScreen = 1
  tcModel.isServiceSpecific = true
  tcModel.useNonStandardStacks = false
  tcModel.publisherCountryCode = 'DE'
  tcModel.publisherCC = 'DE'

  Object.keys(gvl.purposes || {}).forEach((id) => {
    const purposeId = Number(id)
    tcModel.purposeConsents.set(purposeId, accepted)
    tcModel.purposeLegitimateInterests.set(purposeId, !accepted)
  })

  Object.keys(gvl.specialFeatures || {}).forEach((id) => {
    tcModel.specialFeatureOptins.set(Number(id), accepted)
  })

  Object.keys(gvl.vendors || {}).forEach((id) => {
    const vendorId = Number(id)
    tcModel.vendorConsents.set(vendorId, accepted)
    tcModel.vendorLegitimateInterests.set(vendorId, !accepted)
  })

  return tcModel.tcString
}

const buildTcData = () => ({
  tcString: cmpConsentState?.tcString || '',
  eventStatus: 'tcloaded',
  cmpStatus: 'loaded',
  gdprApplies: true
})

const notifyTcfListeners = () => {
  const tcData = buildTcData()
  tcfListeners.forEach((cb) => {
    try { cb(tcData, true) } catch {}
  })
}

const initTcfApi = () => {
  if (typeof window === 'undefined' || typeof window.__tcfapi === 'function') return

  window.__tcfapi = (command, version, callback, parameter) => {
    if (version !== 2 || typeof callback !== 'function') {
      if (typeof callback === 'function') callback(null, false)
      return
    }

    if (command === 'ping') {
      callback({
        gdprApplies: true,
        cmpLoaded: true,
        cmpStatus: 'loaded',
        apiVersion: '2.2'
      }, true)
      return
    }

    if (command === 'getTCData') {
      callback(buildTcData(), true)
      return
    }

    if (command === 'addEventListener') {
      const id = tcfListenerSeq++
      tcfListeners.set(id, callback)
      callback({ ...buildTcData(), listenerId: id }, true)
      return
    }

    if (command === 'removeEventListener') {
      tcfListeners.delete(Number(parameter))
      callback(true, true)
      return
    }

    callback(null, false)
  }
}

const loadConsentState = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(TCF_STORAGE_KEY)
    cmpConsentState = raw ? JSON.parse(raw) : null
  } catch {
    cmpConsentState = null
  }
  showConsentBanner.value = !cmpConsentState?.tcString
}

const setConsent = async (accepted) => {
  const tcString = await createTcString(accepted)
  cmpConsentState = { accepted, tcString, updatedAt: Date.now() }
  window.localStorage.setItem(TCF_STORAGE_KEY, JSON.stringify(cmpConsentState))
  showConsentBanner.value = false
  notifyTcfListeners()
}

const waitForCmpConsent = (timeoutMs = 6000) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ gdprApplies: false, tcString: '' })
      return
    }

    const tcfApi = window.__tcfapi
    if (typeof tcfApi !== 'function') {
      resolve({ gdprApplies: false, tcString: '' })
      return
    }

    let done = false
    let listenerId = null
    const finish = (payload) => {
      if (done) return
      done = true
      if (listenerId != null) {
        try { tcfApi('removeEventListener', 2, () => {}, listenerId) } catch {}
      }
      resolve(payload)
    }

    const timer = setTimeout(() => {
      finish({ gdprApplies: false, tcString: '' })
    }, timeoutMs)

    tcfApi('addEventListener', 2, (tcData, success) => {
      if (!success || !tcData) return
      listenerId = tcData.listenerId ?? listenerId
      const status = String(tcData.eventStatus || '').toLowerCase()
      if (status === 'tcloaded' || status === 'useractioncomplete') {
        clearTimeout(timer)
        finish({
          gdprApplies: Boolean(tcData.gdprApplies),
          tcString: tcData.tcString || ''
        })
      }
    })
  })
}

onMounted(() => {
  initTcfApi()
  loadConsentState()

  const container = adContainer.value
  if (!container) return

  waitForCmpConsent().then(({ gdprApplies, tcString }) => {
    const ins = document.createElement('ins')
    ins.className = 'asm_async_creative'
    ins.style.cssText = 'display:inline-block;width:300px;height:200px;text-align:left;text-decoration:none;'
    ins.setAttribute('data-asm-cdn', 'cdn.adspirit.de')
    ins.setAttribute('data-asm-host', 'bmm.adspirit.de')
    const params = new URLSearchParams({ pid: '71', gdpr: gdprApplies ? '1' : '0' })
    if (gdprApplies) {
      params.set('gdpr_consent', tcString || '')
    }
    ins.setAttribute('data-asm-params', params.toString())
    container.appendChild(ins)

    if (!document.getElementById('adspirit-async-script')) {
      const script = document.createElement('script')
      script.id = 'adspirit-async-script'
      script.src = 'https://cdn.adspirit.de/adasync.min.js'
      script.type = 'text/javascript'
      document.body.appendChild(script)
    }
  })
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

.consent-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 40;
  padding: 16px;
}

.consent-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.consent-text {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.consent-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
