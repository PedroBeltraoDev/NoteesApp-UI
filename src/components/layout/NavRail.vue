<template>
  <!-- Fundo escurecido da gaveta (só aparece no celular, com o menu aberto) -->
  <div v-if="mobileOpen" class="rail-overlay" aria-hidden="true" @click="closeMobile"></div>

  <aside
    id="app-rail"
    ref="rail"
    class="rail"
    :class="{ expanded, open: mobileOpen }"
    @keydown.esc="onEscape"
  >
    <a :href="homeHref" class="rail-brand" aria-label="NoteesApp: ir para as notas" @click.prevent="goNotes">
      <AppLogo :size="40" :wordmark="expanded || mobileOpen" />
    </a>

    <nav class="rail-nav" aria-label="Principal">
      <a
        :href="homeHref"
        class="rail-item"
        :class="{ active: onNotes }"
        :aria-current="onNotes ? 'page' : undefined"
        title="Notas"
        @click.prevent="goNotes"
      >
        <i class="pi pi-file" aria-hidden="true"></i>
        <span class="rail-label">Notas</span>
      </a>

      <a
        :href="settingsHref"
        class="rail-item"
        :class="{ active: onSettings }"
        :aria-current="onSettings ? 'page' : undefined"
        title="Configurações"
        @click.prevent="goSettings"
      >
        <i class="pi pi-cog" aria-hidden="true"></i>
        <span class="rail-label">Configurações</span>
      </a>
    </nav>

    <div class="rail-bottom">
      <button
        type="button"
        class="rail-item"
        :title="isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
        :aria-label="isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
        @click="toggleTheme"
      >
        <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" aria-hidden="true"></i>
        <span class="rail-label">{{ isDark ? 'Tema claro' : 'Tema escuro' }}</span>
      </button>

      <button type="button" class="rail-item" title="Sair" @click="$emit('logout')">
        <i class="pi pi-sign-out" aria-hidden="true"></i>
        <span class="rail-label">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import { useTheme } from '@/composables/useTheme'

// Pastas e tags são navegadas dentro da tela de notas (Todas | Pastas | Tags); aqui ficam só as páginas do app
const props = withDefaults(
  defineProps<{
    expanded?: boolean
    mobileOpen?: boolean
  }>(),
  { expanded: false, mobileOpen: false }
)

const emit = defineEmits<{
  'update:mobileOpen': [value: boolean]
  logout: []
}>()

const router = useRouter()
const route = useRoute()
const { isDark, toggle: toggleTheme } = useTheme()

const rail = ref<HTMLElement | null>(null)

const HOME = '/'
const SETTINGS = '/configuracoes'
const homeHref = computed(() => router.resolve(HOME).href)
const settingsHref = computed(() => router.resolve(SETTINGS).href)
const onNotes = computed(() => route.path === HOME)
const onSettings = computed(() => route.path === SETTINGS)

const closeMobile = () => emit('update:mobileOpen', false)

// "Notas" sempre volta ao começo: todas as notas, sem pasta nem tag abertas
const goNotes = async () => {
  closeMobile()
  await router.push(HOME)
}

const goSettings = async () => {
  closeMobile()
  await router.push(SETTINGS)
}

const onEscape = () => {
  if (props.mobileOpen) closeMobile()
}

// Gaveta no celular: leva o foco para dentro ao abrir e devolve ao botão do cabeçalho ao fechar
let opener: HTMLElement | null = null
watch(
  () => props.mobileOpen,
  async open => {
    if (open) {
      opener = document.activeElement as HTMLElement | null
      await nextTick()
      rail.value?.querySelector<HTMLElement>('.rail-nav .rail-item')?.focus()
    } else {
      opener?.focus?.()
      opener = null
    }
  }
)
</script>

<style scoped>
.rail {
  position: sticky;
  top: 0;
  align-self: start;
  height: calc(100vh - 16px);
  width: var(--rail-w);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px;
  box-sizing: border-box;
  background: var(--rail-bg);
  border-right: 1px solid var(--border-color);
  overflow-x: hidden;
  overflow-y: auto;
  transition: width var(--transition-normal);
  z-index: 50;
}

.rail.expanded {
  width: var(--rail-w-expanded);
}

.rail-brand {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 4px;
  margin-bottom: 8px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}

.rail-nav,
.rail-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rail-bottom {
  margin-top: auto;
}

.rail-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 48px;
  padding: 0 14px;
  box-sizing: border-box;
  background: none;
  border: none;
  border-radius: 12px;
  color: var(--text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.rail-item .pi {
  flex-shrink: 0;
  width: 20px;
  font-size: 20px;
  text-align: center;
}

.rail-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.rail-item.active {
  background: var(--accent-soft);
  color: var(--accent-text);
}

/* Barra recolhida (desktop): o texto fica só para leitores de tela */
.rail:not(.expanded) .rail-label {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.rail-overlay {
  display: none;
}

/* Celular: a barra vira uma gaveta que desliza da esquerda */
@media (max-width: 767px) {
  .rail {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100vh;
    width: min(288px, 86vw);
    transform: translateX(-100%);
    visibility: hidden;
    transition: transform var(--transition-normal), visibility 0s linear var(--transition-normal);
    z-index: 300;
    border-right: none;
    box-shadow: var(--shadow-lg);
  }

  .rail.open {
    transform: none;
    visibility: visible;
    transition: transform var(--transition-normal);
  }

  .rail.expanded {
    width: min(288px, 86vw);
  }

  /* Na gaveta os rótulos sempre aparecem */
  .rail:not(.expanded) .rail-label {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
  }

  .rail-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 250;
    animation: overlayIn var(--transition-fast);
  }
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
