<template>
  <header class="topbar">
    <div class="topbar-left">
      <button
        type="button"
        class="icon-btn menu-btn"
        :aria-label="navOpen ? 'Fechar o menu' : 'Abrir o menu'"
        :aria-expanded="navOpen"
        aria-controls="app-rail"
        @click="$emit('toggleNav')"
      >
        <i class="pi pi-bars" aria-hidden="true"></i>
      </button>
      <h1 class="page-title">{{ title }}</h1>
    </div>

    <div class="topbar-right">
      <template v-if="showSearch">
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
      </template>

      <AccountMenu :email="userEmail" @settings="goToSettings" @logout="handleLogout" />
    </div>

    <!-- Busca no celular: linha própria abaixo do cabeçalho -->
    <div v-if="showSearch && mobileSearchOpen" id="search-mobile" class="mobile-search" role="search">
      <label for="search-mobile-input" class="sr-only">Buscar notas</label>
      <i class="pi pi-search search-icon" aria-hidden="true"></i>
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

const props = withDefaults(
  defineProps<{ title?: string; search?: string; showSearch?: boolean; navOpen?: boolean }>(),
  { title: 'Notas', search: undefined, showSearch: true, navOpen: false }
)
const emit = defineEmits(['search', 'toggleNav'])

const router = useRouter()

const searchQuery = ref(props.search ?? '')
const mobileSearchOpen = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const userEmail = computed(() => session.user?.email ?? null)

// O pai pode limpar a busca (ex.: botão "Limpar busca" no estado sem resultados)
watch(() => props.search, value => {
  if (value !== undefined && value !== searchQuery.value) searchQuery.value = value
})

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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.topbar-right {
  margin-left: auto;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--text-primary);
  white-space: nowrap;
}

/* Botões só com ícone: 40px no desktop, 44px (alvo de toque) no celular */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--hover-bg);
}

.btn-search-toggle {
  display: none;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  height: 44px;
  padding: 0 14px 0 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.mobile-search {
  display: none;
  position: relative;
  flex-basis: 100%;
}

@media (max-width: 767px) {
  .topbar {
    padding: 12px 14px;
    gap: 12px;
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

  .topbar-left,
  .topbar-right {
    gap: 10px;
  }
}
</style>
