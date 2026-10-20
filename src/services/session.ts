import { reactive } from 'vue'

export interface SessionUser {
  id: string
  email: string
}

// Formato devolvido por /api/auth/register, /login e /refresh
export interface Session {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: SessionUser
}

export const SESSION_STORAGE_KEY = 'noteesapp_session'

function readStorage(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Session
    return parsed?.accessToken && parsed?.refreshToken && parsed?.user ? parsed : null
  } catch {
    return null
  }
}

function writeStorage(value: Session | null) {
  try {
    if (value) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // localStorage indisponível (modo privado, cota): a sessão vale só até recarregar a página
  }
}

const state = reactive<{ current: Session | null }>({ current: readStorage() })
const clearedListeners = new Set<() => void>()

export const session = {
  get current(): Session | null {
    return state.current
  },

  get user(): SessionUser | null {
    return state.current?.user ?? null
  },

  get accessToken(): string | null {
    return state.current?.accessToken ?? null
  },

  get refreshToken(): string | null {
    return state.current?.refreshToken ?? null
  },

  // Logado = ainda tem um refresh token válido. O access token vence em minutos e é renovado sozinho.
  get isAuthenticated(): boolean {
    const current = state.current
    return !!current && new Date(current.refreshTokenExpiresAt).getTime() > Date.now()
  },

  set(value: Session) {
    state.current = value
    writeStorage(value)
  },

  clear() {
    const hadSession = state.current !== null
    state.current = null
    writeStorage(null)
    if (hadSession) clearedListeners.forEach(listener => listener())
  },

  // Relê o que está salvo: outra aba pode ter renovado os tokens (ou feito logout) nesse meio-tempo
  reload() {
    state.current = readStorage()
  },

  // Avisa quando a sessão termina (logout, refresh recusado), para o app voltar ao login
  onCleared(listener: () => void) {
    clearedListeners.add(listener)
    return () => clearedListeners.delete(listener)
  }
}

// Mantém as abas sincronizadas: login/logout/renovação numa aba vale para as outras
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== SESSION_STORAGE_KEY) return

    const hadSession = state.current !== null
    session.reload()

    if (hadSession && state.current === null) clearedListeners.forEach(listener => listener())
  })
}
