import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { 
    path: '/', 
    name: 'Dashboard',
    component: DashboardView 
  },
  { 
    path: '/configuracoes', 
    name: 'Configurações',
    component: SettingsView 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router