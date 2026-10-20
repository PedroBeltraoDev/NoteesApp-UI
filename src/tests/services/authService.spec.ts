import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'
import { session } from '@/services/session'
import { apiResponse, authHeader, makeSession, mockFetch, resetSession, rejection } from '../helpers'

describe('authService', () => {
  beforeEach(() => resetSession())
  afterEach(() => vi.unstubAllGlobals())

  it('login stores the session and returns the user', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: makeSession() }))

    const user = await authService.login('pessoa@teste.com', 'senha-segura-123')

    expect(user.email).toBe('pessoa@teste.com')
    expect(session.isAuthenticated).toBe(true)
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/auth/login')
    expect(JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)).toEqual({
      email: 'pessoa@teste.com',
      password: 'senha-segura-123'
    })
  })

  it('login with wrong credentials throws and leaves no session', async () => {
    mockFetch(() => apiResponse(401, { message: 'E-mail ou senha inválidos' }))

    const error = await rejection(authService.login('pessoa@teste.com', 'errada'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    expect(session.isAuthenticated).toBe(false)
  })

  it('register stores the session', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: makeSession() }))

    await authService.register('nova@teste.com', 'senha-segura-123')

    expect(String(fetchMock.mock.calls[0]![0])).toContain('/auth/register')
    expect(session.isAuthenticated).toBe(true)
  })

  it('register surfaces a duplicated e-mail as a 409', async () => {
    mockFetch(() => apiResponse(409, { message: 'E-mail já cadastrado' }))

    const error = await rejection(authService.register('existe@teste.com', 'senha-segura-123'))

    expect(error.status).toBe(409)
    expect(session.isAuthenticated).toBe(false)
  })

  it('logout revokes the refresh token on the server and clears the session', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200))

    await authService.logout()

    expect(String(fetchMock.mock.calls[0]![0])).toContain('/auth/logout')
    expect(JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)).toEqual({ refreshToken: 'refresh-1' })
    expect(session.isAuthenticated).toBe(false)
  })

  it('logout clears the local session even when the server is unreachable', async () => {
    session.set(makeSession())
    mockFetch(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(authService.logout()).resolves.toBeUndefined()

    expect(session.isAuthenticated).toBe(false)
  })

  it('logout without a session does not call the server', async () => {
    const fetchMock = mockFetch(() => apiResponse(200))

    await authService.logout()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('me sends the access token', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200, { data: { id: 'user-1', email: 'pessoa@teste.com' } }))

    const me = await authService.me()

    expect(me.email).toBe('pessoa@teste.com')
    expect(authHeader(fetchMock.mock.calls[0]![1])).toBe('Bearer access-1')
  })
})
