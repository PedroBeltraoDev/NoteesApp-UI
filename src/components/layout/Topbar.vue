<template>
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="logo" @click="$router.push('/')">NoteesApp</h1>
      <nav class="nav-menu">
        <router-link to="/" class="nav-item" active-class="active">Início</router-link>
        <router-link to="/configuracoes" class="nav-item" active-class="active">Configurações</router-link>
      </nav>
    </div>
    
    <div class="topbar-right"> 
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          v-if="$route.path === '/'"
          type="text" 
          placeholder="Buscar notas..." 
          @input="handleSearch"
        />
      </div> 
      
      <button v-if="$route.path === '/'" class="btn-new-note" @click="$emit('createNote')">
        Nova Nota +
      </button>
      <button @click="handleLogout" class="btn-logout">
        Sair 🔓
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const emit = defineEmits(['createNote', 'search'])

const handleLogout = () => {
  localStorage.removeItem('noteesapp_auth')
  localStorage.removeItem('noteesapp_auth_time')
  router.push('/login')
}

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('search', target.value)
}
</script>

<style scoped>
.topbar {
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--topbar-text);
  cursor: pointer;
  transition: color 0.2s;
  letter-spacing: -0.5px;
}

.logo:hover {
  color: var(--accent-color);
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  text-decoration: none;
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: var(--hover-topbar-item);
  color: var(--topbar-text);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  width: 320px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn-new-note {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.btn-new-note:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
</style>