import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { session } from '@/services/session'
import {
  demoState,
  demoDeadline,
  demoRemainingMs,
  expireDemo,
  dismissDemoExpired,
  noteSessionEnding,
  checkStoredDemo,
  DEMO_EXPIRED_CODE
} from '@/services/demo'
import { authService } from '@/services/authService'
import { request, ApiError } from '@/services/http'
import { apiResponse, makeSession, mockFetch, resetSession } from '../helpers'

const NOW = new Date('2026-10-21T12:00:00Z')
const minutesFromNow = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000).toISOString()

const demoSession = (minutes: number) =>
  makeSession({
    user: { id: 'demo-1', email: 'demo-1@demo.noteesapp.invalid', isDemo: true, demoExpiresAt: minutesFromNow(minutes) },
    refreshTokenExpiresAt: minutesFromNow(minutes)
  })

describe('demo account state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    resetSession()
    demoState.expired = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('deadline', () => {
    it('a regular account has no deadline', () => {
      session.set(makeSession())

      expect(demoDeadline()).toBeNull()
      expect(demoRemainingMs()).toBeNull()
    })

    it('without a session there is no deadline either', () => {
      expect(demoRemainingMs()).toBeNull()
    })

    it('a demo account counts down to the deadline the server gave', () => {
      session.set(demoSession(30))

      expect(demoDeadline()).toBe(NOW.getTime() + 30 * 60_000)
      expect(demoRemainingMs()).toBe(30 * 60_000)

      vi.advanceTimersByTime(10 * 60_000)
      expect(demoRemainingMs()).toBe(20 * 60_000)
    })

    it('never goes negative', () => {
      session.set(demoSession(1))

      vi.advanceTimersByTime(5 * 60_000)

      expect(demoRemainingMs()).toBe(0)
    })

    it('ignores a missing or invalid deadline instead of expiring by mistake', () => {
      session.set(makeSession({ user: { id: 'd', email: 'd@x', isDemo: true, demoExpiresAt: null } }))
      expect(demoRemainingMs()).toBeNull()

      session.set(makeSession({ user: { id: 'd', email: 'd@x', isDemo: true, demoExpiresAt: 'não é data' } }))
      expect(demoRemainingMs()).toBeNull()
    })
  })

  describe('expiring', () => {
    it('expireDemo shows the notice and ends the session', () => {
      session.set(demoSession(0))

      expireDemo()

      expect(demoState.expired).toBe(true)
      expect(session.current).toBeNull()
    })

    it('dismissDemoExpired hides the notice', () => {
      demoState.expired = true

      dismissDemoExpired()

      expect(demoState.expired).toBe(false)
    })
  })

  describe('noteSessionEnding (a 401 ended the session: was it the demo?)', () => {
    it('yes, when the server says demo_expired', () => {
      session.set(demoSession(20)) // o relógio local ainda diz que sobra tempo

      noteSessionEnding({ errors: { code: [DEMO_EXPIRED_CODE] } })

      expect(demoState.expired).toBe(true)
    })

    it('yes, when the server already deleted the account (plain 401) but the demo clock has run out', () => {
      session.set(demoSession(0))

      noteSessionEnding({ errors: {} })

      expect(demoState.expired).toBe(true)
    })

    it('yes, within a few seconds of the deadline (device and server clocks differ a little)', () => {
      session.set(demoSession(0.05)) // 3 s

      noteSessionEnding()

      expect(demoState.expired).toBe(true)
    })

    it('no, for a demo with plenty of time left and an ordinary 401', () => {
      session.set(demoSession(20))

      noteSessionEnding({ errors: {} })

      expect(demoState.expired).toBe(false)
    })

    it('no, for a regular account', () => {
      session.set(makeSession())

      noteSessionEnding({ errors: {} })

      expect(demoState.expired).toBe(false)
    })
  })

  describe('checkStoredDemo (opening the app)', () => {
    it('a saved demo that already ended shows the notice and drops the dead session', () => {
      session.set(demoSession(-5))

      checkStoredDemo()

      expect(demoState.expired).toBe(true)
      expect(session.current).toBeNull()
    })

    it('a saved demo still running is left alone', () => {
      session.set(demoSession(12))

      checkStoredDemo()

      expect(demoState.expired).toBe(false)
      expect(session.current).not.toBeNull()
    })

    it('a regular session or no session does nothing', () => {
      checkStoredDemo()
      session.set(makeSession())
      checkStoredDemo()

      expect(demoState.expired).toBe(false)
      expect(session.current).not.toBeNull()
    })
  })

  describe('authService.demo', () => {
    it('creates the demo with no credentials, stores the session and clears an old expired notice', async () => {
      demoState.expired = true
      const created = demoSession(30)
      const fetchMock = mockFetch(() => apiResponse(201, { data: created }))

      const user = await authService.demo()

      expect(user.isDemo).toBe(true)
      expect(session.user?.demoExpiresAt).toBe(created.user.demoExpiresAt)
      expect(demoState.expired).toBe(false)
      const init = fetchMock.mock.calls[0]![1] as RequestInit
      expect(String(fetchMock.mock.calls[0]![0])).toContain('/auth/demo')
      expect(init.method).toBe('POST')
      expect(init.body).toBeUndefined() // sem e-mail nem senha
      expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
    })

    it('a refused demo (503) leaves no session', async () => {
      mockFetch(() => apiResponse(503, { message: 'Há muitas contas demo ativas agora' }))

      await expect(authService.demo()).rejects.toMatchObject({ status: 503 })

      expect(session.current).toBeNull()
    })
  })

  describe('when the server ends the demo during a request', () => {
    it('a refresh refused with demo_expired ends the session AND shows the demo notice', async () => {
      session.set(demoSession(20))
      mockFetch(url =>
        url.endsWith('/auth/refresh')
          ? apiResponse(401, { message: 'O tempo da conta demo acabou', errors: { code: [DEMO_EXPIRED_CODE] } })
          : apiResponse(401, { message: 'Token expirado' })
      )

      const error = await request('/notes').catch(e => e)

      expect(error).toBeInstanceOf(ApiError)
      expect(session.current).toBeNull()
      expect(demoState.expired).toBe(true)
    })

    it('a plain 401 on a regular account ends the session but shows no demo notice', async () => {
      session.set(makeSession())
      mockFetch(url =>
        url.endsWith('/auth/refresh') ? apiResponse(401, { message: 'Sessão inválida' }) : apiResponse(401, { message: 'Token expirado' })
      )

      await request('/notes').catch(() => {})

      expect(session.current).toBeNull()
      expect(demoState.expired).toBe(false)
    })

    it('a demo whose account the server already deleted (plain 401) is recognized by the clock', async () => {
      session.set(demoSession(0))
      mockFetch(url =>
        url.endsWith('/auth/refresh') ? apiResponse(401, { message: 'Sessão inválida' }) : apiResponse(401, { message: 'Token expirado' })
      )

      await request('/notes').catch(() => {})

      expect(demoState.expired).toBe(true)
    })

    it('a transient failure (network) does not end the demo', async () => {
      session.set(demoSession(20))
      mockFetch(url => {
        if (url.endsWith('/auth/refresh')) throw new TypeError('Failed to fetch')
        return apiResponse(401, { message: 'Token expirado' })
      })

      await request('/notes').catch(() => {})

      expect(session.current).not.toBeNull()
      expect(demoState.expired).toBe(false)
    })
  })
})
