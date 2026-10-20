import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { request, ApiError, API_BASE_URL } from '@/services/http'
import { session } from '@/services/session'
import { apiResponse, authHeader, makeSession, mockFetch, resetSession, rejection } from '../helpers'

describe('http.request', () => {
  beforeEach(() => resetSession())
  afterEach(() => vi.unstubAllGlobals())

  it('sends the access token and returns the unwrapped data', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200, { data: [{ id: 1 }] }))

    const data = await request<{ id: number }[]>('/notes')

    expect(data).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes`)
    expect(authHeader(fetchMock.mock.calls[0]![1])).toBe('Bearer access-1')
  })

  it('builds the query string and skips empty values', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200, { data: [] }))

    await request('/notes', { query: { folder: 'Trabalho', tag: null, page: undefined, q: '' } })

    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes?folder=Trabalho`)
  })

  it('sends JSON bodies with the right content type', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 1 } }))

    await request('/notes', { method: 'POST', body: { title: 'x' } })

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ title: 'x' }))
  })

  it('does not send Authorization on public routes', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200, { data: {} }))

    await request('/auth/login', { method: 'POST', body: {}, auth: false })

    expect(authHeader(fetchMock.mock.calls[0]![1])).toBeUndefined()
  })

  it('turns API errors into ApiError with message and field errors', async () => {
    mockFetch(() => apiResponse(400, { message: 'E-mail inválido', errors: { Email: ['E-mail inválido'] } }))

    const error = await rejection(request('/auth/register', { method: 'POST', body: {}, auth: false }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('E-mail inválido')
    expect(error.errors.Email).toEqual(['E-mail inválido'])
  })

  it('reports network failures as ApiError with status 0 and keeps the session', async () => {
    session.set(makeSession())
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    const error = await rejection(request('/notes'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(session.isAuthenticated).toBe(true)
  })

  it('gives a friendly message for 5xx without a JSON body', async () => {
    session.set(makeSession())
    mockFetch(() => new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await rejection(request('/notes'))

    expect(error.status).toBe(502)
    expect(error.message).toContain('servidor')
  })

  it('a 401 on a public route (wrong password) does not try to refresh', async () => {
    const fetchMock = mockFetch(() => apiResponse(401, { message: 'E-mail ou senha inválidos' }))

    const error = await rejection(request('/auth/login', { method: 'POST', body: {}, auth: false }))

    expect(error.status).toBe(401)
    expect(error.message).toBe('E-mail ou senha inválidos')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('http.request - token refresh', () => {
  beforeEach(() => resetSession())
  afterEach(() => vi.unstubAllGlobals())

  const renewedSession = () =>
    makeSession({ accessToken: 'access-2', refreshToken: 'refresh-2' })

  it('on 401 renews the token, retries once and returns the data', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) return apiResponse(200, { data: renewedSession() })
      return authHeader(init) === 'Bearer access-2'
        ? apiResponse(200, { data: ['ok'] })
        : apiResponse(401, { message: 'Token expirado' })
    })

    const data = await request('/notes')

    expect(data).toEqual(['ok'])
    expect(fetchMock).toHaveBeenCalledTimes(3) // falha, refresh, nova tentativa
    expect(session.accessToken).toBe('access-2')
    expect(session.refreshToken).toBe('refresh-2')

    const refreshCall = fetchMock.mock.calls[1]!
    expect(String(refreshCall[0])).toContain('/auth/refresh')
    expect(JSON.parse((refreshCall[1] as RequestInit).body as string)).toEqual({ refreshToken: 'refresh-1' })
    expect(authHeader(refreshCall[1])).toBeUndefined()
  })

  it('renews only once when several requests fail together', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(async (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        await new Promise(resolve => setTimeout(resolve, 20))
        return apiResponse(200, { data: renewedSession() })
      }
      return authHeader(init) === 'Bearer access-2' ? apiResponse(200, { data: 'ok' }) : apiResponse(401)
    })

    const results = await Promise.all([request('/notes'), request('/notes/folders'), request('/notes/tags')])

    expect(results).toEqual(['ok', 'ok', 'ok'])
    const refreshCalls = fetchMock.mock.calls.filter(call => String(call[0]).endsWith('/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })

  it('uses the tokens another tab already renewed instead of refreshing again', async () => {
    session.set(makeSession())
    // Outra aba renovou e gravou no storage; esta aba ainda enviou o token antigo
    const fetchMock = mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) return apiResponse(500)
      return authHeader(init) === 'Bearer access-from-other-tab' ? apiResponse(200, { data: 'ok' }) : apiResponse(401)
    })
    localStorage.setItem(
      'noteesapp_session',
      JSON.stringify(makeSession({ accessToken: 'access-from-other-tab', refreshToken: 'refresh-from-other-tab' }))
    )

    const data = await request('/notes')

    expect(data).toBe('ok')
    const refreshCalls = fetchMock.mock.calls.filter(call => String(call[0]).endsWith('/auth/refresh'))
    expect(refreshCalls).toHaveLength(0)
  })

  it('ends the session when the refresh token is rejected', async () => {
    session.set(makeSession())
    const onCleared = vi.fn()
    const unsubscribe = session.onCleared(onCleared)
    mockFetch(url => (url.endsWith('/auth/refresh') ? apiResponse(401, { message: 'Sessão inválida' }) : apiResponse(401)))

    const error = await rejection(request('/notes'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(session.isAuthenticated).toBe(false)
    expect(onCleared).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('keeps the session when the refresh fails for a transient reason', async () => {
    session.set(makeSession())
    mockFetch(url => (url.endsWith('/auth/refresh') ? apiResponse(503) : apiResponse(401)))

    const error = await rejection(request('/notes'))

    expect(error.status).toBe(503)
    expect(session.isAuthenticated).toBe(true)
  })

  it('keeps the session when the refresh is rate limited', async () => {
    session.set(makeSession())
    mockFetch(url => (url.endsWith('/auth/refresh') ? apiResponse(429) : apiResponse(401)))

    const error = await rejection(request('/notes'))

    expect(error.status).toBe(429)
    expect(session.isAuthenticated).toBe(true)
  })

  it('ends the session if the retry is still unauthorized', async () => {
    session.set(makeSession())
    mockFetch(url => (url.endsWith('/auth/refresh') ? apiResponse(200, { data: renewedSession() }) : apiResponse(401)))

    const error = await rejection(request('/notes'))

    expect(error.status).toBe(401)
    expect(session.isAuthenticated).toBe(false)
  })

  it('without any session, a 401 fails without calling refresh', async () => {
    const fetchMock = mockFetch(() => apiResponse(401, { message: 'Autenticação necessária' }))

    const error = await rejection(request('/notes'))

    expect(error.status).toBe(401)
    expect(fetchMock.mock.calls.filter(c => String(c[0]).endsWith('/auth/refresh'))).toHaveLength(0)
  })

  it('does not retry non-401 errors', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(404, { message: 'Nota não encontrada' }))

    const error = await rejection(request('/notes/9'))

    expect(error.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
