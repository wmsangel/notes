// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

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
        path: '/todos/:id',
        name: 'TodoList',
        component: () => import('@/views/TodoList.vue'),
        meta: { title: 'Список задач' }
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
        meta: { title: 'Поиск' }
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
    next()
})

export default router