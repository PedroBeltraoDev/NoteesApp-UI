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
    <a :href="homeHref" class="rail-brand" aria-label="NoteesApp: ir para as notas" @click.prevent="goHome">
      <AppLogo :size="40" :wordmark="expanded || mobileOpen" />
    </a>

    <nav class="rail-nav" aria-label="Principal">
      <a
        :href="homeHref"
        class="rail-item"
        :class="{ active: onNotes && !hasFilter && !flyout }"
        :aria-current="onNotes && !hasFilter ? 'page' : undefined"
        title="Notas"
        @click.prevent="goNotes"
      >
        <i class="pi pi-file" aria-hidden="true"></i>
        <span class="rail-label">Notas</span>
      </a>

      <template v-if="showFilters">
        <button
          ref="foldersBtn"
          type="button"
          class="rail-item"
          :class="{ active: !!selectedFolder || flyout === 'folders' }"
          :aria-expanded="flyout === 'folders'"
          aria-haspopup="dialog"
          title="Pastas"
          @click="toggleFlyout('folders')"
        >
          <i class="pi pi-folder" aria-hidden="true"></i>
          <span class="rail-label">Pastas</span>
        </button>

        <button
          ref="tagsBtn"
          type="button"
          class="rail-item"
          :class="{ active: !!selectedTag || flyout === 'tags' }"
          :aria-expanded="flyout === 'tags'"
          aria-haspopup="dialog"
          title="Tags"
          @click="toggleFlyout('tags')"
        >
          <i class="pi pi-hashtag" aria-hidden="true"></i>
          <span class="rail-label">Tags</span>
        </button>
      </template>

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

  <!-- Painel de pastas/tags: ao lado da barra no desktop, folha no topo no celular -->
  <div v-if="flyout" ref="flyoutWrap" class="flyout-wrap">
    <FilterFlyout
      :kind="flyout"
      :items="flyout === 'folders' ? folders : tags"
      :selected="flyout === 'folders' ? selectedFolder : selectedTag"
      @select="pick"
      @close="closeFlyout(true)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import FilterFlyout from './FilterFlyout.vue'
import { useTheme } from '@/composables/useTheme'

const props = withDefaults(
  defineProps<{
    expanded?: boolean
    mobileOpen?: boolean
    showFilters?: boolean
    folders?: string[]
    tags?: string[]
    selectedFolder?: string | null
    selectedTag?: string | null
  }>(),
  { expanded: false, mobileOpen: false, showFilters: false, folders: () => [], tags: () => [], selectedFolder: null, selectedTag: null }
)

const emit = defineEmits<{
  'update:mobileOpen': [value: boolean]
  selectFolder: [folder: string]
  selectTag: [tag: string]
  clearFilters: []
  logout: []
}>()

const router = useRouter()
const route = useRoute()
const { isDark, toggle: toggleTheme } = useTheme()

const rail = ref<HTMLElement | null>(null)
const flyoutWrap = ref<HTMLElement | null>(null)
const foldersBtn = ref<HTMLButtonElement | null>(null)
const tagsBtn = ref<HTMLButtonElement | null>(null)
const flyout = ref<'folders' | 'tags' | null>(null)

const HOME = '/'
const SETTINGS = '/configuracoes'
const homeHref = computed(() => router.resolve(HOME).href)
const settingsHref = computed(() => router.resolve(SETTINGS).href)
const onNotes = computed(() => route.path === HOME)
const onSettings = computed(() => route.path === SETTINGS)
const hasFilter = computed(() => !!props.selectedFolder || !!props.selectedTag)

const closeMobile = () => emit('update:mobileOpen', false)

const closeFlyout = (returnFocus = false) => {
  const opener = flyout.value === 'folders' ? foldersBtn.value : tagsBtn.value
  flyout.value = null
  if (returnFocus) opener?.focus()
}

const toggleFlyout = (kind: 'folders' | 'tags') => {
  flyout.value = flyout.value === kind ? null : kind
}

const goHome = async () => {
  closeFlyout()
  closeMobile()
  if (hasFilter.value) emit('clearFilters')
  await router.push(HOME)
}

// "Notas" volta à lista completa: limpa pasta/tag quando houver
const goNotes = async () => {
  closeFlyout()
  closeMobile()
  if (onNotes.value) {
    if (hasFilter.value) emit('clearFilters')
    return
  }
  await router.push(HOME)
}

const goSettings = async () => {
  closeFlyout()
  closeMobile()
  await router.push(SETTINGS)
}

const pick = (value: string) => {
  if (flyout.value === 'folders') emit('selectFolder', value)
  else if (flyout.value === 'tags') emit('selectTag', value)
  flyout.value = null
  closeMobile()
}

const onEscape = (event: KeyboardEvent) => {
  if (flyout.value) {
    event.stopPropagation()
    closeFlyout(true)
  } else if (props.mobileOpen) {
    closeMobile()
  }
}

// Clique fora fecha o painel de pastas/tags
const onDocumentPointerDown = (event: Event) => {
  if (!flyout.value) return
  const target = event.target as Node
  const inside =
    flyoutWrap.value?.contains(target) || foldersBtn.value?.contains(target) || tagsBtn.value?.contains(target)
  if (!inside) flyout.value = null
}

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && flyout.value) closeFlyout(true)
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

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
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

.rail-item.active,
.rail-item[aria-expanded='true'] {
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

.flyout-wrap {
  position: fixed;
  top: 84px;
  left: calc(var(--rail-current, var(--rail-w)) + 20px);
  z-index: 60;
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

  .flyout-wrap {
    top: 72px;
    left: 12px;
    right: 12px;
    z-index: 400;
  }

  .flyout-wrap :deep(.flyout) {
    width: 100%;
  }
}

@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
