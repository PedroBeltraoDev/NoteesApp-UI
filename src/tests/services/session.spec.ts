import { describe, it, expect, beforeEach, vi } from 'vitest'
import { session, SESSION_STORAGE_KEY } from '@/services/session'
import { makeSession, resetSession } from '../helpers'

describe('session', () => {
  beforeEach(() => resetSession())

  it('starts unauthenticated', () => {
    expect(session.isAuthenticated).toBe(false)
    expect(session.user).toBeNull()
    expect(session.accessToken).toBeNull()
  })

  it('stores the session in localStorage and exposes its pieces', () => {
    session.set(makeSession())

    expect(session.isAuthenticated).toBe(true)
    expect(session.user?.email).toBe('pessoa@teste.com')
    expect(session.accessToken).toBe('access-1')
    expect(session.refreshToken).toBe('refresh-1')
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!).accessToken).toBe('access-1')
  })

  it('is not authenticated once the refresh token has expired', () => {
    session.set(makeSession({ refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString() }))

    expect(session.isAuthenticated).toBe(false)
  })

  it('stays authenticated with an expired access token (it is renewed on demand)', () => {
    session.set(makeSession({ accessTokenExpiresAt: new Date(Date.now() - 60_000).toISOString() }))

    expect(session.isAuthenticated).toBe(true)
  })

  it('clear() removes the session and notifies listeners once', () => {
    const listener = vi.fn()
    const unsubscribe = session.onCleared(listener)
    session.set(makeSession())

    session.clear()
    session.clear()

    expect(session.isAuthenticated).toBe(false)
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('reload() picks up what another tab saved', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(makeSession({ accessToken: 'da-outra-aba' })))

    session.reload()

    expect(session.accessToken).toBe('da-outra-aba')
  })

  it('ignores corrupted storage', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{nao-e-json')

    session.reload()

    expect(session.isAuthenticated).toBe(false)
  })

  it('notifies listeners when another tab logs out', () => {
    const listener = vi.fn()
    const unsubscribe = session.onCleared(listener)
    session.set(makeSession())

    localStorage.removeItem(SESSION_STORAGE_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY }))

    expect(session.isAuthenticated).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
