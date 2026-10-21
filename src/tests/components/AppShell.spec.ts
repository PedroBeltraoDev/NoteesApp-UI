import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { makeSession, resetSession } from '../helpers'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), register: vi.fn(), logout: vi.fn().mockResolvedValue(undefined), me: vi.fn() }
}))

const stub = { template: '<div />' }

async function mountShell(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/configuracoes', component: stub },
      { path: '/login', component: stub }
    ]
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(AppShell, {
    props,
    slots: { default: '<p class="content">Conteúdo da página</p>' },
    global: { plugins: [router] },
    attachTo: document.body
  })
  return { wrapper, router }
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSession()
    session.set(makeSession())
    document.documentElement.className = 'dark-mode'
    vi.mocked(authService.logout).mockClear()
    window.innerWidth = 1280
  })

  it('wraps the page content in a focusable main landmark after a skip link', async () => {
    const { wrapper } = await mountShell({ title: 'Notas' })

    expect(wrapper.find('a.skip-link').attributes('href')).toBe('#conteudo')
    const main = wrapper.find('main#conteudo')
    expect(main.attributes('tabindex')).toBe('-1')
    expect(main.find('.content').text()).toBe('Conteúdo da página')
    wrapper.unmount()
  })

  it('has a single h1 with the page title', async () => {
    const { wrapper } = await mountShell({ title: 'Configurações' })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('Configurações')
    wrapper.unmount()
  })

  it('shows the search only when the page asks for it', async () => {
    const withSearch = await mountShell({ showSearch: true })
    expect(withSearch.wrapper.find('#search-desktop').exists()).toBe(true)
    withSearch.wrapper.unmount()

    const without = await mountShell({ showSearch: false })
    expect(without.wrapper.find('#search-desktop').exists()).toBe(false)
    without.wrapper.unmount()
  })

  it('forwards search, folder, tag and clear events to the page', async () => {
    const { wrapper } = await mountShell({ showSearch: true, showFilters: true, folders: ['Trabalho'], tags: ['casa'] })

    await wrapper.find('#search-desktop').setValue('bolo')
    await wrapper.find('.rail-item[title="Pastas"]').trigger('click')
    await flushPromises()
    await wrapper.find('.flyout-item').trigger('click')
    await wrapper.find('.rail-item[title="Tags"]').trigger('click')
    await flushPromises()
    await wrapper.find('.flyout-item').trigger('click')

    expect(wrapper.emitted('search')?.[0]).toEqual(['bolo'])
    expect(wrapper.emitted('selectFolder')?.[0]).toEqual(['Trabalho'])
    expect(wrapper.emitted('selectTag')?.[0]).toEqual(['casa'])
    wrapper.unmount()
  })

  it('shows the copyright footer', async () => {
    const { wrapper } = await mountShell()

    expect(wrapper.find('footer').text()).toContain(`© ${new Date().getFullYear()} NoteesApp`)
    wrapper.unmount()
  })

  // ---------- Barra lateral

  it('on desktop the menu button expands and collapses the rail, remembering the choice', async () => {
    const { wrapper } = await mountShell()
    const button = wrapper.find('button.menu-btn')
    expect(wrapper.find('.rail').classes()).not.toContain('expanded')
    expect(button.attributes('aria-expanded')).toBe('false')

    await button.trigger('click')

    expect(wrapper.find('.rail').classes()).toContain('expanded')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(localStorage.getItem('noteesapp-rail-expanded')).toBe('true')

    await button.trigger('click')

    expect(wrapper.find('.rail').classes()).not.toContain('expanded')
    expect(localStorage.getItem('noteesapp-rail-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('restores the expanded rail on the next visit', async () => {
    localStorage.setItem('noteesapp-rail-expanded', 'true')

    const { wrapper } = await mountShell()

    expect(wrapper.find('.rail').classes()).toContain('expanded')
    wrapper.unmount()
  })

  it('on mobile the menu button opens the drawer instead', async () => {
    window.innerWidth = 375
    const { wrapper } = await mountShell()

    await wrapper.find('button.menu-btn').trigger('click')

    expect(wrapper.find('.rail').classes()).toContain('open')
    expect(wrapper.find('.rail').classes()).not.toContain('expanded')
    expect(wrapper.find('button.menu-btn').attributes('aria-expanded')).toBe('true')
    expect(localStorage.getItem('noteesapp-rail-expanded')).toBeNull()
    wrapper.unmount()
  })

  it('growing the window past the mobile breakpoint closes the drawer', async () => {
    window.innerWidth = 375
    const { wrapper } = await mountShell()
    await wrapper.find('button.menu-btn').trigger('click')
    expect(wrapper.find('.rail').classes()).toContain('open')

    window.innerWidth = 1280
    window.dispatchEvent(new Event('resize'))
    await flushPromises()

    expect(wrapper.find('.rail').classes()).not.toContain('open')
    wrapper.unmount()
  })

  it('the rail "Sair" logs out and goes to /login', async () => {
    const { wrapper, router } = await mountShell()

    await wrapper.find('.rail-item[title="Sair"]').trigger('click')
    await flushPromises()

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/login')
    wrapper.unmount()
  })
})
