import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setupAuthGuard } from '@/middleware/auth'
import { session } from '@/services/session'
import { makeSession, resetSession } from '../helpers'

const stub = { template: '<div />' }

// O guard registra um listener global de sessão; um router por arquivo basta para validar o comportamento
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: stub },
    { path: '/', component: stub },
    { path: '/configuracoes', component: stub }
  ]
})
setupAuthGuard(router)

describe('auth guard', () => {
  beforeEach(async () => {
    resetSession()
    await router.replace('/login')
  })

  it('sends anonymous users to /login', async () => {
    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('also protects the other pages', async () => {
    await router.push('/configuracoes')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('lets authenticated users through', async () => {
    session.set(makeSession())

    await router.push('/configuracoes')

    expect(router.currentRoute.value.path).toBe('/configuracoes')
  })

  it('keeps authenticated users away from /login', async () => {
    session.set(makeSession())
    await router.replace('/configuracoes')

    await router.push('/login')

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('treats an expired refresh token as logged out', async () => {
    session.set(makeSession({ refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString() }))

    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('returns to /login as soon as the session is cleared', async () => {
    session.set(makeSession())
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')

    session.clear()
    await router.isReady()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(router.currentRoute.value.path).toBe('/login')
  })
})
