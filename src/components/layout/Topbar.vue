<template>
  <header class="topbar">
    <div class="topbar-container">
      <div class="topbar-left">
        <button
          type="button"
          class="icon-btn menu-btn"
          aria-label="Abrir menu de pastas e tags"
          @click="toggleMobileMenu"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>
        <button type="button" class="logo" @click="goHome">NoteesApp</button>
      </div>

      <div class="topbar-right">
        <div class="search-container" role="search">
          <label for="search-desktop" class="sr-only">Buscar notas</label>
          <i class="pi pi-search search-icon" aria-hidden="true"></i>
          <input
            id="search-desktop"
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Buscar notas..."
            autocomplete="off"
            @input="handleSearch"
          />
        </div>

        <button
          type="button"
          class="icon-btn btn-search-toggle"
          :aria-expanded="mobileSearchOpen"
          aria-controls="search-mobile"
          aria-label="Buscar notas"
          title="Buscar notas"
          @click="toggleMobileSearch"
        >
          <i :class="mobileSearchOpen ? 'pi pi-times' : 'pi pi-search'" aria-hidden="true"></i>
        </button>

        <button
          type="button"
          class="icon-btn btn-theme"
          :aria-label="isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
          :title="isDark ? 'Tema claro' : 'Tema escuro'"
          @click="toggleTheme"
        >
          <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" aria-hidden="true"></i>
        </button>

        <PButton
          @click="$emit('createNote')"
          label="Nova Nota"
          icon="pi pi-plus"
          severity="success"
          class="btn-new-note"
          aria-label="Nova nota"
        />

        <AccountMenu :email="userEmail" @settings="goToSettings" @logout="handleLogout" />
      </div>
    </div>

    <!-- Busca no celular: linha própria abaixo da barra -->
    <div v-if="mobileSearchOpen" id="search-mobile" class="mobile-search" role="search">
      <label for="search-mobile-input" class="sr-only">Buscar notas</label>
      <input
        id="search-mobile-input"
        ref="mobileSearchInput"
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Buscar notas..."
        autocomplete="off"
        @input="handleSearch"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AccountMenu from './AccountMenu.vue'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{ search?: string }>()
const emit = defineEmits(['createNote', 'search'])

const router = useRouter()
const { isDark, toggle: toggleTheme } = useTheme()

const searchQuery = ref(props.search ?? '')
const mobileSearchOpen = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const userEmail = computed(() => session.user?.email ?? null)

// O pai pode limpar a busca (ex.: botão "Limpar busca" no estado sem resultados)
watch(() => props.search, value => {
  if (value !== undefined && value !== searchQuery.value) searchQuery.value = value
})

const toggleMobileMenu = () => {
  window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))
}

const toggleMobileSearch = async () => {
  mobileSearchOpen.value = !mobileSearchOpen.value
  if (mobileSearchOpen.value) {
    await nextTick()
    mobileSearchInput.value?.focus()
  }
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const goHome = () => {
  router.push('/')
}

const goToSettings = () => {
  router.push('/configuracoes')
}

const handleLogout = async () => {
  // Revoga o refresh token no servidor e limpa a sessão local; o guard do router leva ao login
  await authService.logout()
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

.logo {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  margin: 0;
  letter-spacing: -0.5px;
  white-space: nowrap;
  border-radius: 6px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

/* Botões só com ícone: 40px no desktop, 44px (alvo de toque) no mobile */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.menu-btn {
  display: none;
  color: var(--text-primary);
  font-size: 22px;
}

.btn-search-toggle {
  display: none;
}

.search-container {
  position: relative;
  flex: 0 1 400px;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.search-container .search-input {
  padding-left: 36px;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.mobile-search {
  display: none;
  padding: 0 16px 12px;
}

.btn-new-note.p-button {
  height: 40px;
  padding: 0 20px;
  white-space: nowrap;
}

/* ============================================
   RESPONSIVIDADE
   ============================================ */

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
    display: inline-flex;
  }

  .search-container {
    display: none;
  }

  .btn-search-toggle {
    display: inline-flex;
  }

  .mobile-search {
    display: block;
  }

  .icon-btn {
    width: 44px;
    height: 44px;
  }

  .logo {
    font-size: 20px;
  }

  .btn-new-note.p-button {
    width: 44px;
    height: 44px;
    padding: 0;
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

  .topbar-right {
    gap: 4px;
  }

  .logo {
    font-size: 18px;
  }
}
</style>
