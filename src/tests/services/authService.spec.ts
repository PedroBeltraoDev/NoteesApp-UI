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

  it('deleteAccount sends the password with the access token and clears the session', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(200))

    await authService.deleteAccount('senha-segura-123')

    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit]
    expect(String(url)).toContain('/auth/delete-account')
    expect(init.method).toBe('POST')
    expect(authHeader(init)).toBe('Bearer access-1')
    expect(JSON.parse(init.body as string)).toEqual({ password: 'senha-segura-123' })
    expect(session.isAuthenticated).toBe(false)
  })

  it('deleteAccount for a demo (no password) sends no body', async () => {
    session.set(makeSession({ user: { id: 'demo-1', email: 'demo@demo.noteesapp.invalid', isDemo: true } }))
    const fetchMock = mockFetch(() => apiResponse(200))

    await authService.deleteAccount()

    expect((fetchMock.mock.calls[0]![1] as RequestInit).body).toBeUndefined()
    expect(session.isAuthenticated).toBe(false)
  })

  it('a wrong password (400) keeps the person logged in, with no refresh attempt', async () => {
    session.set(makeSession())
    const fetchMock = mockFetch(() => apiResponse(400, { message: 'Senha incorreta', errors: { code: ['invalid_password'] } }))

    const error = await rejection(authService.deleteAccount('errada-123456'))

    expect(error.status).toBe(400)
    expect(error.errors.code).toEqual(['invalid_password'])
    expect(session.isAuthenticated).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('a failure while deleting (server down) keeps the session so the person can try again', async () => {
    session.set(makeSession())
    mockFetch(() => apiResponse(500))

    await rejection(authService.deleteAccount('senha-segura-123'))

    expect(session.isAuthenticated).toBe(true)
  })
})
