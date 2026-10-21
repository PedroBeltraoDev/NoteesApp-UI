import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import DemoBanner from '@/components/layout/DemoBanner.vue'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { demoState } from '@/services/demo'
import { makeSession, resetSession } from '../helpers'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), demo: vi.fn(), logout: vi.fn().mockResolvedValue(undefined), me: vi.fn() }
}))

const NOW = new Date('2026-10-21T12:00:00Z')
const demoSession = (seconds: number) =>
  makeSession({
    user: { id: 'demo-1', email: 'demo-1@demo.noteesapp.invalid', isDemo: true, demoExpiresAt: new Date(NOW.getTime() + seconds * 1000).toISOString() }
  })

const stub = { template: '<div />' }

async function mountBanner() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/login', component: stub }
    ]
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(DemoBanner, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('DemoBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    resetSession()
    demoState.expired = false
    vi.mocked(authService.logout).mockClear()
  })

  afterEach(() => vi.useRealTimers())

  it('shows nothing for a regular account', async () => {
    session.set(makeSession())

    const { wrapper } = await mountBanner()

    expect(wrapper.find('.demo-banner').exists()).toBe(false)
  })

  it('warns that the demo account will be deleted, with the time left', async () => {
    session.set(demoSession(30 * 60))

    const { wrapper } = await mountBanner()

    expect(wrapper.text()).toContain('Conta demo')
    expect(wrapper.text()).toContain('Será apagada em')
    expect(wrapper.find('.demo-time').text()).toBe('30:00')
  })

  it('counts down every second', async () => {
    session.set(demoSession(90))
    const { wrapper } = await mountBanner()

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.demo-time').text()).toBe('01:29')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(wrapper.find('.demo-time').text()).toBe('00:29')
  })

  it('turns urgent in the last 5 minutes', async () => {
    session.set(demoSession(6 * 60))
    const { wrapper } = await mountBanner()
    expect(wrapper.find('.demo-banner').classes()).not.toContain('urgent')

    await vi.advanceTimersByTimeAsync(61_000)

    expect(wrapper.find('.demo-banner').classes()).toContain('urgent')
  })

  it('screen readers get the minutes in a polite status, and not a message per second', async () => {
    session.set(demoSession(10 * 60))
    const { wrapper } = await mountBanner()

    const status = wrapper.find('[role="status"]')
    expect(status.text()).toBe('Conta demo: restam 10 minutos')
    expect(wrapper.find('.demo-time').attributes('aria-hidden')).toBe('true')

    await vi.advanceTimersByTimeAsync(30_000)
    expect(status.text()).toBe('Conta demo: restam 10 minutos') // 9:30 ainda arredonda para 10: nada novo a anunciar

    await vi.advanceTimersByTimeAsync(31_000)
    expect(status.text()).toBe('Conta demo: restam 9 minutos')
  })

  it('uses the singular for the last minute', async () => {
    session.set(demoSession(40))

    const { wrapper } = await mountBanner()

    expect(wrapper.find('[role="status"]').text()).toBe('Conta demo: restam 1 minuto')
  })

  it('when the time runs out it ends the session and raises the "time is up" notice', async () => {
    session.set(demoSession(3))
    const { wrapper } = await mountBanner()

    await vi.advanceTimersByTimeAsync(4000)

    expect(demoState.expired).toBe(true)
    expect(session.current).toBeNull()
    expect(wrapper.find('.demo-banner').exists()).toBe(false)
  })

  it('catches up as soon as the tab becomes visible again (background tabs slow their timers down)', async () => {
    session.set(demoSession(60))
    await mountBanner()

    vi.setSystemTime(new Date(NOW.getTime() + 5 * 60_000)) // passou muito tempo sem os timers rodarem
    document.dispatchEvent(new Event('visibilitychange'))

    expect(demoState.expired).toBe(true)
  })

  it('"Criar conta real" leaves the demo and opens the sign-up form', async () => {
    session.set(demoSession(20 * 60))
    const { wrapper, router } = await mountBanner()

    await wrapper.find('.demo-action').trigger('click')
    await flushPromises()

    expect(authService.logout).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query).toEqual({ modo: 'cadastro' })
    expect(demoState.expired).toBe(false) // saiu por vontade própria: sem o aviso de tempo esgotado
  })

  it('stops its timer when it goes away', async () => {
    session.set(demoSession(60))
    const { wrapper } = await mountBanner()
    const running = vi.getTimerCount()

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(running - 1) // o intervalo de 1 s do contador
  })
})
