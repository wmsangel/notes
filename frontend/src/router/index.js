// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { authApi } from '@/services/api/auth'

let authChecked = false
let isAuthed = false

async function ensureAuth() {
    if (authChecked) return isAuthed
    try {
        await authApi.me()
        isAuthed = true
    } catch {
        isAuthed = false
    } finally {
        authChecked = true
    }
    return isAuthed
}

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: 'Dashboard' }
    },
    {
        path: '/notes',
        name: 'Notes',
        component: () => import('@/views/Notes.vue'),
        meta: { title: 'Все заметки' }
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { title: 'Вход', public: true }
    },
    {
        path: '/notes/:id',
        name: 'NoteView',
        component: () => import('@/views/NoteView.vue'),
        meta: { title: 'Заметка' }
    },
    {
        path: '/folder/:id',
        name: 'Folder',
        component: () => import('@/views/Folder.vue'),
        meta: { title: 'Папка' }
    },
    {
        path: '/favorites',
        name: 'Favorites',
        component: () => import('@/views/Favorites.vue'),
        meta: { title: 'Избранное' }
    },
    {
        path: '/todos',
        name: 'Todos',
        component: () => import('@/views/Todos.vue'),
        meta: { title: 'Задачи' }
    },
    {
        path: '/todos-overview',
        name: 'TodosOverview',
        component: () => import('@/views/TodosOverview.vue'),
        meta: { title: 'Все задачи' }
    },
    {
        path: '/calendar',
        name: 'Calendar',
        component: () => import('@/views/Calendar.vue'),
        meta: { title: 'Календарь' }
    },
    {
        path: '/todos/:id',
        name: 'TodoList',
        component: () => import('@/views/TodoList.vue'),
        meta: { title: 'Список задач' }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: 'Настройки' }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: '404' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title ? `${to.meta.title} - Notes` : 'Notes System'
    if (to.meta.public) {
        next()
        return
    }
    ensureAuth().then((ok) => {
        if (!ok) return next('/login')
        next()
    })
})

export default router
