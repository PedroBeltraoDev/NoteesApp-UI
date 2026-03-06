<template>
  <header class="topbar">
    <div class="topbar-container">
      <div class="topbar-left">
        <button @click="toggleMobileMenu" class="menu-btn">☰</button>
        <h1 class="logo" @click="$router.push('/')">NoteesApp</h1>
        <nav class="desktop-nav">
          <router-link to="/" class="nav-link">Início</router-link>
          <router-link to="/configuracoes" class="nav-link">Configurações</router-link>
        </nav>
      </div>
      
      <div class="topbar-right">
        <div class="search-container">
          <input 
            v-model="searchQuery"
            @input="handleSearch"
            type="text" 
            placeholder="Buscar notas..."
            class="search-input"
          />
        </div>
        
        <button @click="$emit('createNote')" class="btn-new-note">
          <span class="btn-text">Nova Nota</span>
          <span class="btn-icon">+</span>
        </button>
        
        <button @click="handleLogout" class="btn-logout" title="Sair">
          🔓
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

const emit = defineEmits(['createNote', 'search'])

const toggleMobileMenu = () => {
  window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleLogout = () => {
  localStorage.removeItem('noteesapp_auth')
  localStorage.removeItem('noteesapp_auth_time')
  router.push('/login')
}
</script>

<style scoped>
.topbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.topbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-btn {
  display: block;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: var(--hover-bg);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  margin: 0;
  letter-spacing: -0.5px;
}

.desktop-nav {
  display: none;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn-new-note {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-new-note:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

.btn-text {
  display: none;
}

.btn-icon {
  font-size: 18px;
  font-weight: 600;
}

.btn-logout {
  background: var(--bg-tertiary);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: var(--hover-bg);
}

/* Desktop */
@media (min-width: 769px) {
  .menu-btn {
    display: none;
  }
  
  .desktop-nav {
    display: flex;
  }
  
  .search-container {
    max-width: 400px;
  }
  
  .btn-text {
    display: inline;
  }
  
  .btn-icon {
    display: none;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .topbar-container {
    padding: 12px 16px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .search-container {
    display: none;
  }
  
  .btn-new-note {
    padding: 8px 12px;
  }
}
</style>