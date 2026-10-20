<template>
  <AppShell title="Configurações">
    <div class="settings-grid">
      <!-- Tema -->
      <section class="setting-card" aria-labelledby="theme-title">
        <div class="card-header">
          <h2 id="theme-title">Tema</h2>
          <p>Escolha como o NoteesApp deve aparecer. “Sistema” segue a configuração do seu aparelho.</p>
        </div>
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
            <span class="theme-preview" :class="option.value" aria-hidden="true"></span>
            <span class="theme-name">{{ option.label }}</span>
          </button>
        </div>
      </section>

      <!-- Conta -->
      <section class="setting-card" aria-labelledby="account-title">
        <div class="card-header">
          <h2 id="account-title">Conta</h2>
          <p>{{ userEmail ?? 'Sem sessão ativa' }}</p>
        </div>
        <button class="btn-sign-out" type="button" @click="signOut">
          <i class="pi pi-sign-out" aria-hidden="true"></i> Sair da conta
        </button>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { session } from '@/services/session'
import { authService } from '@/services/authService'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const router = useRouter()
const { mode, setMode } = useTheme()

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' }
]

const userEmail = computed(() => session.user?.email ?? null)

const signOut = async () => {
  await authService.logout()
  router.push('/login')
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  gap: 16px;
  max-width: 760px;
}

.setting-card {
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.card-header {
  margin-bottom: 16px;
}

.card-header h2 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-header p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.theme-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 12px;
  color: var(--text-primary);
  font: inherit;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.theme-option:hover {
  background: var(--hover-bg);
}

.theme-option.active {
  border-color: var(--accent-color);
  background: var(--accent-soft);
}

.theme-preview {
  width: 100%;
  height: 64px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.theme-preview.light {
  background: #f4f5f7;
}

.theme-preview.dark {
  background: #17171a;
}

.theme-preview.system {
  background: linear-gradient(135deg, #f4f5f7 50%, #17171a 50%);
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
}

.btn-sign-out {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-sign-out:hover {
  background: var(--hover-bg);
}

@media (max-width: 480px) {
  .theme-selector {
    gap: 8px;
  }
}
</style>
