<template>
  <div class="app-frame" :style="{ '--rail-current': expanded ? 'var(--rail-w-expanded)' : 'var(--rail-w)' }">
    <a href="#conteudo" class="skip-link">Pular para o conteúdo</a>

    <div class="app">
      <NavRail v-model:mobileOpen="mobileOpen" :expanded="expanded" @logout="handleLogout" />

      <div class="app-main">
        <Topbar
          :title="title"
          :search="search"
          :showSearch="showSearch"
          :navOpen="isMobile ? mobileOpen : expanded"
          @search="$emit('search', $event)"
          @toggleNav="toggleNav"
        />

        <main id="conteudo" class="panel" tabindex="-1">
          <slot />
        </main>

        <footer class="app-footer">© {{ year }} NoteesApp</footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import NavRail from './NavRail.vue'
import Topbar from './Topbar.vue'
import { authService } from '@/services/authService'

withDefaults(
  defineProps<{
    title?: string
    search?: string
    showSearch?: boolean
  }>(),
  { title: 'Notas', search: undefined, showSearch: false }
)

defineEmits<{
  search: [query: string]
}>()

const router = useRouter()
const year = new Date().getFullYear()

const RAIL_KEY = 'noteesapp-rail-expanded'
const readExpanded = () => {
  try {
    return localStorage.getItem(RAIL_KEY) === 'true'
  } catch {
    return false
  }
}

const expanded = ref(readExpanded())
const mobileOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

// No celular o botão do cabeçalho abre a gaveta; no desktop alterna barra recolhida/expandida
const toggleNav = () => {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value
    return
  }

  expanded.value = !expanded.value
  try {
    localStorage.setItem(RAIL_KEY, String(expanded.value))
  } catch {
    // a preferência vale só para esta sessão
  }
}

const onResize = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) mobileOpen.value = false
}

const handleLogout = async () => {
  await authService.logout()
  router.push('/login')
}

onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.app-frame {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 8px;
  background: var(--frame-bg);
}

.app {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  min-height: calc(100vh - 16px);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: clip;
}

.app-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel {
  flex: 1;
  margin: 0 20px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.panel:focus {
  outline: none;
}

.app-footer {
  padding: 16px 20px 20px;
  font-size: 12px;
  color: var(--text-tertiary);
}

@media (max-width: 767px) {
  .app-frame {
    padding: 0;
  }

  .app {
    grid-template-columns: minmax(0, 1fr);
    min-height: 100vh;
    border-radius: 0;
  }

  .panel {
    margin: 0 12px;
    padding: 14px;
  }

  .app-footer {
    padding: 14px 16px 18px;
  }
}
</style>
