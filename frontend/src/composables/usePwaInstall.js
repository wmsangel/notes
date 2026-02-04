/**
 * PWA install: Chrome beforeinstallprompt + подсказки для Safari (Mac/iOS).
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function usePwaInstall() {
  const installPromptEvent = ref(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isSafari = ref(false)
  const isIOS = ref(false)

  const isStandalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true)

  const handler = (e) => {
    e.preventDefault()
    installPromptEvent.value = e
    isInstallable.value = true
  }

  onMounted(() => {
    isInstalled.value = isStandalone()

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    isSafari.value = /Safari/i.test(ua) && !/Chrome/i.test(ua)
    isIOS.value = /iPad|iPhone|iPod/.test(ua)

    window.addEventListener('beforeinstallprompt', handler)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handler)
  })

  async function install() {
    if (!installPromptEvent.value) return false
    installPromptEvent.value.prompt()
    const { outcome } = await installPromptEvent.value.userChoice
    if (outcome === 'accepted') {
      isInstallable.value = false
      installPromptEvent.value = null
      return true
    }
    return false
  }

  return {
    installPromptEvent,
    isInstallable,
    isInstalled,
    isSafari,
    isIOS,
    install,
    isStandalone,
  }
}
