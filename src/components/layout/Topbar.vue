<template>
  <header class="topbar">
    <div class="topbar-container">
      <div class="topbar-left">
        <button @click="toggleMobileMenu" class="menu-btn">☰</button>
        <h1 class="logo" @click="$router.push('/')">NoteesApp</h1>
      </div>
      
      <div class="topbar-right">
        <div class="search-container">
          <PInputText
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Buscar notas..."
            class="search-input"
          />
        </div>
        
        <PButton 
          @click="toggleDarkMode" 
          :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
          text 
          severity="secondary"
          class="btn-theme"
          :pt="{
            root: { style: { width: '40px', height: '40px' } }
          }"
        />
        
        <PButton 
          @click="$emit('createNote')" 
          label="Nova Nota" 
          icon="pi pi-plus"
          severity="success"
          class="btn-new-note"
        />
        
        <PButton 
          @click="handleLogout" 
          icon="pi pi-sign-out"
          text 
          severity="secondary"
          class="btn-logout"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const isDarkMode = ref(true)

onMounted(() => {
  // Verificar tema salvo
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
    applyTheme()
  }
})

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
    document.body.classList.remove('light-mode')
  } else {
    document.body.classList.remove('dark-mode')
    document.body.classList.add('light-mode')
  }
}

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
  width: 100%;
}

.topbar-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
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
  transition: all var(--transition-fast);
}

.menu-btn:hover {
  background: var(--hover-bg);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  margin: 0;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.search-container {
  position: relative;
  flex: 0 1 400px; 
  max-width: 400px;
}

.search-container :deep(.p-inputtext) {
  width: 100%;
  height: 40px;
  background: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-theme :deep(.p-button) {
  width: 40px;
  height: 40px;
}

.btn-new-note :deep(.p-button) {
  height: 40px;
  padding: 0 20px;
}

.btn-logout :deep(.p-button) {
  width: 40px;
  height: 40px;
}

/* ============================================
   RESPONSIVIDADE
   ============================================ */

/* Desktop (padrão) */
@media (min-width: 769px) {
  .menu-btn {
    display: none; 
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .topbar-container {
    padding: 16px 20px;
  }
  
  .search-container {
    flex: 0 1 300px;
    max-width: 300px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .menu-btn {
    display: block; 
  }
  
  .search-container {
    display: none; 
  }
  
  .logo {
    font-size: 20px;
  }
  
  .btn-new-note :deep(.p-button-label) {
    display: none; 
  }
  
  .topbar-container {
    padding: 12px 16px;
  }
}

/* Mobile pequeno */
@media (max-width: 480px) {
  .topbar-container {
    padding: 12px;
    gap: 8px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .btn-logout {
    display: none; 
  }
}
</style>