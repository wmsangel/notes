// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// Register Service Worker only in production (VitePWA generates sw.js on build)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
    })
}