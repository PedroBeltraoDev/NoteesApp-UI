import { vi } from 'vitest'
import type { ApiError } from '@/services/http'
import { session, SESSION_STORAGE_KEY, type Session } from '@/services/session'

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    accessToken: 'access-1',
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken: 'refresh-1',
    refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 3_600_000).toISOString(),
    user: { id: 'user-1', email: 'pessoa@teste.com' },
    ...overrides
  }
}

// Resposta no formato da API: { success, message, data, errors }
export function apiResponse(status: number, body: { data?: unknown; message?: string; errors?: Record<string, string[]> } = {}) {
  const ok = status >= 200 && status < 300
  return new Response(
    JSON.stringify({ success: ok, message: body.message ?? '', data: body.data ?? null, errors: body.errors ?? null }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}

export function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init ?? {}))
  vi.stubGlobal('fetch', fn)
  return fn
}

export function authHeader(init: RequestInit | undefined) {
  return (init?.headers as Record<string, string> | undefined)?.Authorization
}

export function resetSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
  session.reload()
}

// Espera que a promessa falhe e devolve o erro já tipado
export async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }
  throw new Error('A promessa deveria ter sido rejeitada')
}
