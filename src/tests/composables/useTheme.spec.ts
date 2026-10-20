import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// O módulo guarda estado global (modo e preferência do sistema): cada teste importa uma cópia nova
type ThemeModule = typeof import('@/composables/useTheme')

let systemDark = true
let mediaListeners: Array<(event: { matches: boolean }) => void> = []

function stubMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return systemDark
      },
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => mediaListeners.push(listener),
      removeEventListener: vi.fn()
    }))
  )
  // jsdom lê window.matchMedia
  window.matchMedia = (globalThis as any).matchMedia
}

async function loadTheme(): Promise<ThemeModule> {
  vi.resetModules()
  return import('@/composables/useTheme')
}

describe('useTheme', () => {
  beforeEach(() => {
    systemDark = true
    mediaListeners = []
    localStorage.clear()
    document.body.className = ''
    document.documentElement.style.colorScheme = ''
    stubMatchMedia()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('follows the system theme by default (dark)', async () => {
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().mode.value).toBe('system')
    expect(useTheme().isDark.value).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(true)
    expect(document.body.classList.contains('light-mode')).toBe(false)
  })

  it('follows the system theme by default (light)', async () => {
    systemDark = false
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().isDark.value).toBe(false)
    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('setMode applies the classes and persists under one key', async () => {
    const { initTheme, setThemeMode } = await loadTheme()
    initTheme()

    setThemeMode('light')

    expect(document.body.classList.contains('light-mode')).toBe(true)
    expect(document.body.classList.contains('dark-mode')).toBe(false)
    expect(localStorage.getItem('noteesapp-theme')).toBe('light')
  })

  it('an explicit choice wins over the system preference', async () => {
    const { initTheme, setThemeMode, useTheme } = await loadTheme()
    initTheme()

    setThemeMode('light') // sistema está escuro

    expect(useTheme().isDark.value).toBe(false)
  })

  it('toggle flips the resolved theme', async () => {
    const { initTheme, toggleTheme, useTheme } = await loadTheme()
    initTheme() // sistema escuro

    toggleTheme()
    expect(useTheme().isDark.value).toBe(false)
    expect(useTheme().mode.value).toBe('light')

    toggleTheme()
    expect(useTheme().isDark.value).toBe(true)
    expect(useTheme().mode.value).toBe('dark')
  })

  it('restores the saved mode on startup', async () => {
    localStorage.setItem('noteesapp-theme', 'light')
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().mode.value).toBe('light')
    expect(document.body.classList.contains('light-mode')).toBe(true)
  })

  it('migrates the legacy "theme" key', async () => {
    localStorage.setItem('theme', 'light')
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().mode.value).toBe('light')
    expect(localStorage.getItem('noteesapp-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('ignores garbage in storage', async () => {
    localStorage.setItem('noteesapp-theme', 'roxo')
    const { initTheme, useTheme } = await loadTheme()

    initTheme()

    expect(useTheme().mode.value).toBe('system')
  })

  it('reacts to the system theme changing while in "system" mode', async () => {
    const { initTheme, useTheme } = await loadTheme()
    initTheme()
    expect(useTheme().isDark.value).toBe(true)

    systemDark = false
    mediaListeners.forEach(listener => listener({ matches: false }))

    expect(useTheme().isDark.value).toBe(false)
    expect(document.body.classList.contains('light-mode')).toBe(true)
  })

  it('does not follow the system once the user picked a theme', async () => {
    const { initTheme, setThemeMode, useTheme } = await loadTheme()
    initTheme()
    setThemeMode('dark')

    systemDark = false
    mediaListeners.forEach(listener => listener({ matches: false }))

    expect(useTheme().isDark.value).toBe(true)
  })
})
