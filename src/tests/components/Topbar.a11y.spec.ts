import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Topbar from '@/components/layout/Topbar.vue'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { makeSession, resetSession } from '../helpers'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), logout: vi.fn().mockResolvedValue(undefined), me: vi.fn() }
}))

const stub = { template: '<div />' }

async function mountTopbar(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/login', component: stub },
      { path: '/configuracoes', component: stub }
    ]
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(Topbar, { props, global: { plugins: [router] }, attachTo: document.body })
  return { wrapper, router }
}

describe('Topbar (acessibilidade e mobile)', () => {
  beforeEach(() => {
    resetSession()
    session.set(makeSession())
    vi.mocked(authService.logout).mockClear()
  })

  it('every icon-only button has an accessible name', async () => {
    const { wrapper } = await mountTopbar()

    const iconButtons = wrapper.findAll('button.icon-btn')

    expect(iconButtons.length).toBeGreaterThanOrEqual(2) // menu e busca
    for (const button of iconButtons) {
      expect(button.attributes('aria-label'), button.html()).toBeTruthy()
    }
    wrapper.unmount()
  })

  it('labels the search fields', async () => {
    const { wrapper } = await mountTopbar()

    expect(wrapper.find('label[for="search-desktop"]').exists()).toBe(true)
    expect(wrapper.find('#search-desktop').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the mobile search starts closed and opens a labelled, focused field', async () => {
    const { wrapper } = await mountTopbar()
    expect(wrapper.find('#search-mobile').exists()).toBe(false)

    const toggle = wrapper.find('button.btn-search-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#search-mobile').exists()).toBe(true)
    expect(wrapper.find('label[for="search-mobile-input"]').exists()).toBe(true)
    expect(document.activeElement).toBe(wrapper.find('#search-mobile-input').element)
    wrapper.unmount()
  })

  it('typing in either search field emits "search"', async () => {
    const { wrapper } = await mountTopbar()

    await wrapper.find('#search-desktop').setValue('bolo')
    await wrapper.find('button.btn-search-toggle').trigger('click')
    await wrapper.find('#search-mobile-input').setValue('leite')

    expect(wrapper.emitted('search')?.map(e => e[0])).toEqual(['bolo', 'leite'])
    wrapper.unmount()
  })

  it('the parent can clear the search', async () => {
    const { wrapper } = await mountTopbar({ search: 'bolo' })
    expect((wrapper.find('#search-desktop').element as HTMLInputElement).value).toBe('bolo')

    await wrapper.setProps({ search: '' })

    expect((wrapper.find('#search-desktop').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('the account button is named after the logged-in user', async () => {
    const { wrapper } = await mountTopbar()

    const trigger = wrapper.find('button.account-btn')

    expect(trigger.attributes('aria-label')).toBe('Conta de pessoa@teste.com')
    expect(trigger.text()).toContain('pessoa@teste.com') // o nome acessível contém o texto visível
    wrapper.unmount()
  })

  it('the account avatar shows the initial of the e-mail', async () => {
    const { wrapper } = await mountTopbar()

    expect(wrapper.find('.avatar').text()).toBe('P')
    wrapper.unmount()
  })

  it('"Configurações" in the account menu goes to the settings page', async () => {
    const { wrapper, router } = await mountTopbar()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/configuracoes')
    wrapper.unmount()
  })

  it('"Sair" in the account menu logs out and goes to /login', async () => {
    const { wrapper, router } = await mountTopbar()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    await flushPromises()

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/login')
    wrapper.unmount()
  })
})
