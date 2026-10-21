import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const BASE = 'https://api.exemplo.com/api'

let visibility: 'visible' | 'hidden' = 'visible'
let fetchMock: ReturnType<typeof vi.fn>

// O módulo guarda estado (último ping, timers): cada teste começa com uma cópia nova
const load = async () => {
  vi.resetModules()
  return await import('@/services/keepAlive')
}

const pings = () => fetchMock.mock.calls.length
const touch = () => window.dispatchEvent(new Event('pointerdown'))

describe('keepAlive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('wakes the API as soon as the app opens (the login screen included)', async () => {
    const { startKeepAlive } = await load()

    const stop = startKeepAlive(BASE)

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${BASE}/health/ready`, { mode: 'no-cors', cache: 'no-store' })
    stop()
  })

  it('keeps pinging every ~20 s while the person is using the app', async () => {
    const { startKeepAlive, PING_EVERY_MS } = await load()
    const stop = startKeepAlive(BASE)

    for (let i = 0; i < 3; i++) {
      touch()
      await vi.advanceTimersByTimeAsync(PING_EVERY_MS)
    }

    expect(pings()).toBe(4) // abertura + 3
    stop()
  })

  it('stops pinging after 4 minutes without any interaction, so the database can sleep', async () => {
    const { startKeepAlive, ACTIVE_WINDOW_MS } = await load()
    const stop = startKeepAlive(BASE)

    await vi.advanceTimersByTimeAsync(ACTIVE_WINDOW_MS + 30_000)
    const afterWindow = pings()
    await vi.advanceTimersByTimeAsync(5 * 60_000)

    expect(pings()).toBe(afterWindow)
    expect(afterWindow).toBeLessThan(15) // nem ficou pingando a janela inteira sem parar
    stop()
  })

  it('does not ping while the tab is hidden', async () => {
    const { startKeepAlive, PING_EVERY_MS } = await load()
    const stop = startKeepAlive(BASE)
    visibility = 'hidden'

    touch()
    await vi.advanceTimersByTimeAsync(PING_EVERY_MS * 3)

    expect(pings()).toBe(1)
    stop()
  })

  it('coming back to the tab wakes the API right away', async () => {
    const { startKeepAlive, PING_EVERY_MS } = await load()
    const stop = startKeepAlive(BASE)
    visibility = 'hidden'
    await vi.advanceTimersByTimeAsync(PING_EVERY_MS * 4)

    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))

    expect(pings()).toBe(2)
    stop()
  })

  it('moving the mouse again after a long pause wakes the API before the next click', async () => {
    const { startKeepAlive, ACTIVE_WINDOW_MS } = await load()
    const stop = startKeepAlive(BASE)
    await vi.advanceTimersByTimeAsync(ACTIVE_WINDOW_MS + 60_000)
    const before = pings()

    touch()

    expect(pings()).toBe(before + 1)
    stop()
  })

  it('a real request already keeps the API warm, so the next ping waits', async () => {
    const { startKeepAlive, markApiCall, PING_EVERY_MS } = await load()
    const stop = startKeepAlive(BASE)

    await vi.advanceTimersByTimeAsync(PING_EVERY_MS - 5_000)
    markApiCall()
    touch()
    await vi.advanceTimersByTimeAsync(10_000) // passou do tempo do 1º ping, mas houve uma chamada real há 10 s

    expect(pings()).toBe(1)
    stop()
  })

  it('a failing ping is ignored (offline, server asleep)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { startKeepAlive } = await load()

    expect(() => startKeepAlive(BASE)).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
  })

  it('starting twice does not double the pings, and stop() ends them', async () => {
    const { startKeepAlive, PING_EVERY_MS } = await load()
    const stop = startKeepAlive(BASE)
    startKeepAlive(BASE)
    expect(pings()).toBe(1)

    stop()
    touch()
    await vi.advanceTimersByTimeAsync(PING_EVERY_MS * 3)

    expect(pings()).toBe(1)
  })
})
