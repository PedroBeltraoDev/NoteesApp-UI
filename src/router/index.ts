import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuard } from '@/middleware/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/configuracoes',
    name: 'Configurações',
    component: () => import('@/views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

setupAuthGuard(router)

export default router