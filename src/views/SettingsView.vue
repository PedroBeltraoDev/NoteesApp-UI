<template>
  <div class="settings">
    <div class="settings-container">
      <!-- Sidebar -->
      <aside class="settings-sidebar">
        <button @click="goBack" class="btn-back">
          ← Voltar
        </button>
        <h2>Configurações</h2>
      </aside>
      
      <!-- Main Content -->
      <main class="settings-main">
        <div class="settings-grid">
          <!-- Interface Theme -->
          <div class="setting-card">
            <div class="card-header">
              <h3>Interface theme</h3>
              <p>Select or customize your UI theme.</p>
            </div>
            <div class="card-content">
              <div class="theme-selector">
                <div class="theme-option" :class="{ active: !isDarkMode }" @click="setTheme('light')">
                  <div class="theme-preview light"></div>
                  <span>Light</span>
                </div>
                <div class="theme-option" :class="{ active: isDarkMode }" @click="setTheme('dark')">
                  <div class="theme-preview dark"></div>
                  <span>Dark</span>
                </div>
                <div class="theme-option" @click="setTheme('system')">
                  <div class="theme-preview system"></div>
                  <span>System</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Aparência Toggle -->
          <div class="setting-card">
            <div class="card-header">
              <h3>Aparência</h3>
              <p>Alternar entre tema claro e escuro</p>
            </div>
            <div class="card-content">
              <label class="toggle-switch">
                <input type="checkbox" v-model="isDarkMode" @change="toggleDarkMode" />
                <span class="toggle-slider"></span>
                <span class="toggle-label">{{ isDarkMode ? 'Escuro' : 'Claro' }}</span>
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import router from '../router'

const isDarkMode = ref(false)

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
  }
})

const toggleDarkMode = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const setTheme = (theme: string) => {
  if (theme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else if (theme === 'light') {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDarkMode.value = prefersDark
    
    if (prefersDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }
}
</script>

<style scoped>
.settings {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.settings-container {
  display: flex;
  min-height: 100vh;
}

.settings-sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.settings-sidebar h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0 0 0;
}

.btn-back {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;
  align-self: flex-start;
}

.btn-back:hover {
  background: var(--border-color);
}

.settings-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  max-width: 1200px;
}

.setting-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.card-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.card-content {
  margin-top: 20px;
}

.theme-selector {
  display: flex;
  gap: 16px;
}

.theme-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option:hover {
  border-color: var(--accent-color);
}

.theme-option.active {
  border-color: var(--accent-color);
}

.theme-preview {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.theme-preview.light {
  background: #f8f7f4;
}

.theme-preview.dark {
  background: #1a1a1a;
}

.theme-preview.system {
  background: linear-gradient(135deg, #f8f7f4 50%, #1a1a1a 50%);
}

.theme-option span {
  font-size: 14px;
  color: var(--text-primary);
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-slider {
  position: relative;
  width: 52px;
  height: 28px;
  background: var(--border-color);
  border-radius: 28px;
  transition: all 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: all 0.3s;
}

.toggle-switch input {
  display: none;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--accent-color);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 14px;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>