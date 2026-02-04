// frontend/src/composables/useTheme.js
import { ref, watch, onMounted } from 'vue'

const theme = ref('light')

export function useTheme() {
    const setTheme = (newTheme) => {
        theme.value = newTheme
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
    }

    const toggleTheme = () => {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

        if (savedTheme) {
            setTheme(savedTheme)
        } else if (prefersDark) {
            setTheme('dark')
        } else {
            setTheme('light')
        }
    }

    return {
        theme,
        setTheme,
        toggleTheme,
        initTheme
    }
}