// frontend/src/stores/ui.js
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { markRaw } from 'vue'

export const useUIStore = defineStore('ui', () => {
    const sidebarOpen = ref(true)
    const sidebarCollapsed = ref(false)
    const _ignoreOverlayClickUntil = ref(0)
    const modalOpen = ref(false)
    const modalComponent = shallowRef(null)
    const modalProps = ref({})
    const toast = ref({
        show: false,
        message: '',
        type: 'info', // info, success, warning, error
        duration: 3000
    })

    // Sidebar
    function toggleSidebar() {
        sidebarOpen.value = !sidebarOpen.value
    }

    function closeSidebar() {
        sidebarOpen.value = false
    }

    function openSidebar() {
        sidebarOpen.value = true
    }

    function toggleSidebarCollapse() {
        sidebarCollapsed.value = !sidebarCollapsed.value
        try {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value ? 'true' : 'false')
        } catch (_) {}
    }

    // На мобильных есть overlay. При переходе по роуту (MainLayout размонтируется/смонтируется)
    // иногда «проваливается» клик на overlay и меню схлопывается само.
    // Защита: клики внутри sidebar выставляют «игнорировать overlay» на короткое время.
    function ignoreNextOverlayClick(ms = 300) {
        _ignoreOverlayClickUntil.value = Date.now() + ms
    }

    function handleSidebarOverlayClick() {
        if (Date.now() < _ignoreOverlayClickUntil.value) return
        toggleSidebarCollapse()
    }

    // Modal
    function openModal(component, props = {}) {
        modalComponent.value = markRaw(component)
        modalProps.value = props
        modalOpen.value = true
    }

    function closeModal() {
        modalOpen.value = false
        setTimeout(() => {
            modalComponent.value = null
            modalProps.value = {}
        }, 300)
    }

    // Toast notifications
    function showToast(message, type = 'info', duration = 3000) {
        toast.value = {
            show: true,
            message,
            type,
            duration
        }

        setTimeout(() => {
            hideToast()
        }, duration)
    }

    function hideToast() {
        toast.value.show = false
    }

    function showSuccess(message) {
        showToast(message, 'success')
    }

    function showError(message) {
        showToast(message, 'error', 5000)
    }

    function showWarning(message) {
        showToast(message, 'warning', 4000)
    }

    function showInfo(message) {
        showToast(message, 'info')
    }

    return {
        sidebarOpen,
        sidebarCollapsed,
        modalOpen,
        modalComponent,
        modalProps,
        toast,
        toggleSidebar,
        closeSidebar,
        openSidebar,
        toggleSidebarCollapse,
        ignoreNextOverlayClick,
        handleSidebarOverlayClick,
        openModal,
        closeModal,
        showToast,
        hideToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    }
})