import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'noteesapp-theme'
// Chave antiga (Topbar/Configurações gravavam em 'theme'); migrada na primeira leitura
const LEGACY_STORAGE_KEY = 'theme'

const isMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark' || value === 'system'

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isMode(stored)) return stored

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem(THEME_STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return legacy
    }
  } catch {
    // localStorage indisponível: segue o tema do sistema
  }
  return 'system'
}

function writeStoredMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // preferência vale só para esta sessão
  }
}

const mediaQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

const mode = ref<ThemeMode>(readStoredMode())
const systemPrefersDark = ref(mediaQuery ? mediaQuery.matches : true)

const isDark = computed(() => (mode.value === 'system' ? systemPrefersDark.value : mode.value === 'dark'))

// As classes ficam no <html> (e não no <body>): o PrimeVue calcula as variáveis dos componentes em :root,
// então o tema escuro só chega nos painéis soltos no <body> (Select, Toast...) se a classe estiver no mesmo elemento.
function apply() {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark-mode', isDark.value)
  root.classList.toggle('light-mode', !isDark.value)
  // Faz scrollbars e controles nativos acompanharem o tema
  document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
}

let initialized = false

// Chamar uma vez, antes de montar o app: evita o "piscar" do tema errado
export function initTheme() {
  if (!initialized) {
    initialized = true
    mediaQuery?.addEventListener('change', event => {
      systemPrefersDark.value = event.matches
      apply()
    })
  }

  mode.value = readStoredMode()
  systemPrefersDark.value = mediaQuery ? mediaQuery.matches : true
  apply()
}

export function setThemeMode(next: ThemeMode) {
  mode.value = next
  writeStoredMode(next)
  apply()
}

export function toggleTheme() {
  setThemeMode(isDark.value ? 'light' : 'dark')
}

export function useTheme() {
  return { mode, isDark, setMode: setThemeMode, toggle: toggleTheme }
}
