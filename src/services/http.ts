import { session, type Session } from './session'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noteesapp-be.onrender.com/api'

// Formato de todas as respostas da API
interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]> | null
}

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  // status 0 = a requisição nem chegou ao servidor (rede fora, CORS, servidor dormindo)
  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | null | undefined>
  // false nas rotas de autenticação: um 401 ali é "senha errada", não "token vencido"
  auth?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.append(key, String(value))
  }
  const qs = params.toString()
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }
}

async function parse<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null
  try {
    body = (await response.json()) as ApiEnvelope<T>
  } catch {
    // corpo vazio ou que não é JSON (ex.: página de erro do proxy)
  }

  if (response.ok && body?.success !== false) return body?.data as T

  const fallback = response.status >= 500 ? 'Erro no servidor. Tente novamente em instantes.' : `Erro ${response.status}`
  throw new ApiError(response.status, body?.message || fallback, body?.errors ?? {})
}

// --- Renovação do access token -------------------------------------------------------------------
//
// O refresh token é de uso único: o backend trata a reapresentação de um token já usado como roubo e
// derruba TODAS as sessões. Por isso a renovação precisa acontecer uma vez só, mesmo com várias
// requisições falhando juntas (promessa compartilhada) e com várias abas abertas (Web Locks).

let inflightRefresh: Promise<string> | null = null

function withRefreshLock<T>(work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  return locks ? locks.request('noteesapp-refresh', work) : work()
}

async function performRefresh(staleToken: string | null): Promise<string> {
  // Dentro do lock, relê o storage: outra aba pode ter renovado enquanto esperávamos
  session.reload()
  const current = session.current

  if (!current) throw new ApiError(401, 'Sessão expirada. Faça login novamente.')

  if (staleToken && current.accessToken !== staleToken) return current.accessToken

  try {
    const response = await send('/auth/refresh', { method: 'POST', body: { refreshToken: current.refreshToken } }, null)
    const renewed = await parse<Session>(response)
    session.set(renewed)
    return renewed.accessToken
  } catch (error) {
    // Só encerra a sessão quando o servidor recusou o refresh token. Rede fora, 429 ou 5xx são
    // passageiros: o usuário continua logado e tenta de novo.
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) session.clear()
    throw error
  }
}

function refreshAccessToken(staleToken: string | null): Promise<string> {
  if (!inflightRefresh) {
    inflightRefresh = withRefreshLock(() => performRefresh(staleToken)).finally(() => {
      inflightRefresh = null
    })
  }
  return inflightRefresh
}

// --- API pública ---------------------------------------------------------------------------------

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false
  const token = useAuth ? session.accessToken : null

  const response = await send(path, options, token)

  if (response.status !== 401 || !useAuth) return parse<T>(response)

  // 401 numa rota protegida: tenta renovar o token e repete a chamada uma única vez
  let renewedToken: string
  try {
    renewedToken = await refreshAccessToken(token)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) session.clear()
    throw error
  }

  const retry = await send(path, options, renewedToken)

  if (retry.status === 401) {
    session.clear()
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  return parse<T>(retry)
}
