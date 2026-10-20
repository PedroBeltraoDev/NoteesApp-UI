<template>
  <div class="settings">
    <div class="settings-container">
      <!-- Sidebar -->
      <aside class="settings-sidebar">
        <button type="button" @click="goBack" class="btn-back">
          <i class="pi pi-arrow-left" aria-hidden="true"></i> Voltar
        </button>
        <h1>Configurações</h1>
      </aside>

      <!-- Main Content -->
      <main class="settings-main">
        <div class="settings-grid">
          <!-- Tema -->
          <section class="setting-card" aria-labelledby="theme-title">
            <div class="card-header">
              <h2 id="theme-title">Tema</h2>
              <p>Escolha como o NoteesApp deve aparecer. “Sistema” segue a configuração do seu aparelho.</p>
            </div>
            <div class="card-content">
              <div class="theme-selector" role="radiogroup" aria-labelledby="theme-title">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  role="radio"
                  :aria-checked="mode === option.value"
                  class="theme-option"
                  :class="{ active: mode === option.value }"
                  @click="setMode(option.value)"
                >
                  <div class="theme-preview" :class="option.value"></div>
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Conta -->
          <section class="setting-card" aria-labelledby="account-title">
            <div class="card-header">
              <h2 id="account-title">Conta</h2>
              <p>{{ userEmail ?? 'Sem sessão ativa' }}</p>
            </div>
            <div class="card-content">
              <button class="btn-sign-out" type="button" @click="signOut">
                <i class="pi pi-sign-out" aria-hidden="true"></i> Sair da conta
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import router from '../router'
import { session } from '@/services/session'
import { authService } from '@/services/authService'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const { mode, setMode } = useTheme()

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' }
]

const userEmail = computed(() => session.user?.email ?? null)

const goBack = () => {
  router.push('/')
}

const signOut = async () => {
  await authService.logout()
  router.push('/login')
}
</script>

<style scoped>
.btn-sign-out {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-sign-out:hover {
  background: var(--hover-bg);
}

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

.settings-sidebar h1 {
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

.card-header h2 {
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
  font: inherit;
  color: var(--text-primary);
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