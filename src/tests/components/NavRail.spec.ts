import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NavRail from '@/components/layout/NavRail.vue'

const stub = { template: '<div />' }

async function mountRail(props: Record<string, unknown> = {}, path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/configuracoes', component: stub },
      { path: '/login', component: stub }
    ]
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(NavRail, {
    props: { showFilters: true, folders: ['Trabalho', 'Pessoal'], tags: ['importante', 'casa'], ...props },
    global: { plugins: [router] },
    attachTo: document.body
  })
  return { wrapper, router }
}

const item = (wrapper: ReturnType<typeof mount>, title: string) => wrapper.find(`.rail-item[title="${title}"]`)

describe('NavRail', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.className = 'dark-mode'
  })

  it('has the logo and the main navigation', async () => {
    const { wrapper } = await mountRail()

    expect(wrapper.find('.rail-brand').attributes('aria-label')).toContain('NoteesApp')
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Principal')
    expect(wrapper.findAll('.rail-nav .rail-item').map(i => i.attributes('title'))).toEqual([
      'Notas', 'Pastas', 'Tags', 'Configurações'
    ])
    wrapper.unmount()
  })

  it('every item has a text label for screen readers (hidden visually when collapsed)', async () => {
    const { wrapper } = await mountRail()

    expect(wrapper.findAll('.rail-item .rail-label').map(l => l.text())).toEqual([
      'Notas', 'Pastas', 'Tags', 'Configurações', 'Tema claro', 'Sair'
    ])
    wrapper.unmount()
  })

  it('hides Pastas and Tags on pages that have no filters (Configurações)', async () => {
    const { wrapper } = await mountRail({ showFilters: false }, '/configuracoes')

    expect(wrapper.findAll('.rail-nav .rail-item').map(i => i.attributes('title'))).toEqual(['Notas', 'Configurações'])
    wrapper.unmount()
  })

  it('marks the current page with aria-current', async () => {
    const { wrapper } = await mountRail()

    expect(item(wrapper, 'Notas').attributes('aria-current')).toBe('page')
    expect(item(wrapper, 'Configurações').attributes('aria-current')).toBeUndefined()
    wrapper.unmount()
  })

  it('navigation items are real links that go to their pages', async () => {
    const { wrapper, router } = await mountRail()

    expect(item(wrapper, 'Configurações').element.tagName).toBe('A')
    expect(item(wrapper, 'Configurações').attributes('href')).toBe('/configuracoes')

    await item(wrapper, 'Configurações').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/configuracoes')
    wrapper.unmount()
  })

  it('"Notas" goes home from another page', async () => {
    const { wrapper, router } = await mountRail({ showFilters: false }, '/configuracoes')

    await item(wrapper, 'Notas').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })

  it('"Notas" on the list clears the active folder/tag filter', async () => {
    const { wrapper } = await mountRail({ selectedFolder: 'Trabalho' })

    await item(wrapper, 'Notas').trigger('click')

    expect(wrapper.emitted('clearFilters')).toHaveLength(1)
    wrapper.unmount()
  })

  // ---------- Pastas / Tags

  it('Pastas opens a panel listing the folders and focuses the first one', async () => {
    const { wrapper } = await mountRail()

    await item(wrapper, 'Pastas').trigger('click')
    await flushPromises()

    expect(item(wrapper, 'Pastas').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.flyout').attributes('aria-label')).toBe('Pastas')
    expect(wrapper.findAll('.flyout-item').map(b => b.text())).toEqual(['Trabalho', 'Pessoal'])
    expect(document.activeElement).toBe(wrapper.find('.flyout-item').element)
    wrapper.unmount()
  })

  it('Tags opens a panel listing the tags', async () => {
    const { wrapper } = await mountRail()

    await item(wrapper, 'Tags').trigger('click')
    await flushPromises()

    expect(wrapper.find('.flyout').attributes('aria-label')).toBe('Tags')
    expect(wrapper.findAll('.flyout-item').map(b => b.text())).toEqual(['importante', 'casa'])
    wrapper.unmount()
  })

  it('picking a folder emits selectFolder and closes the panel', async () => {
    const { wrapper } = await mountRail()
    await item(wrapper, 'Pastas').trigger('click')
    await flushPromises()

    await wrapper.findAll('.flyout-item')[1]!.trigger('click')

    expect(wrapper.emitted('selectFolder')?.[0]).toEqual(['Pessoal'])
    expect(wrapper.find('.flyout').exists()).toBe(false)
    wrapper.unmount()
  })

  it('picking a tag emits selectTag', async () => {
    const { wrapper } = await mountRail()
    await item(wrapper, 'Tags').trigger('click')
    await flushPromises()

    await wrapper.findAll('.flyout-item')[0]!.trigger('click')

    expect(wrapper.emitted('selectTag')?.[0]).toEqual(['importante'])
    wrapper.unmount()
  })

  it('the selected folder is marked in the panel and on the rail', async () => {
    const { wrapper } = await mountRail({ selectedFolder: 'Pessoal' })

    expect(item(wrapper, 'Pastas').classes()).toContain('active')
    await item(wrapper, 'Pastas').trigger('click')
    await flushPromises()

    const items = wrapper.findAll('.flyout-item')
    expect(items[1]!.attributes('aria-pressed')).toBe('true')
    expect(items[0]!.attributes('aria-pressed')).toBe('false')
    wrapper.unmount()
  })

  it('shows a helpful message when there are no folders yet', async () => {
    const { wrapper } = await mountRail({ folders: [] })

    await item(wrapper, 'Pastas').trigger('click')
    await flushPromises()

    expect(wrapper.find('.flyout-empty').text()).toContain('Nenhuma pasta')
    wrapper.unmount()
  })

  it('Escape closes the panel and returns the focus to the rail item', async () => {
    const { wrapper } = await mountRail()
    await item(wrapper, 'Pastas').trigger('click')
    await flushPromises()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(wrapper.find('.flyout').exists()).toBe(false)
    expect(document.activeElement).toBe(item(wrapper, 'Pastas').element)
    wrapper.unmount()
  })

  it('clicking outside closes the panel', async () => {
    const { wrapper } = await mountRail()
    await item(wrapper, 'Tags').trigger('click')
    await flushPromises()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()

    expect(wrapper.find('.flyout').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clicking the same item again closes the panel; another item switches it', async () => {
    const { wrapper } = await mountRail()

    await item(wrapper, 'Pastas').trigger('click')
    await item(wrapper, 'Tags').trigger('click')
    await flushPromises()
    expect(wrapper.find('.flyout').attributes('aria-label')).toBe('Tags')

    await item(wrapper, 'Tags').trigger('click')
    expect(wrapper.find('.flyout').exists()).toBe(false)
    wrapper.unmount()
  })

  // ---------- Rodapé da barra

  it('"Sair" emits logout', async () => {
    const { wrapper } = await mountRail()

    await item(wrapper, 'Sair').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
    wrapper.unmount()
  })

  it('the theme button says what it will do and switches the theme', async () => {
    const { wrapper } = await mountRail()
    const button = wrapper.find('.rail-bottom .rail-item')
    const before = button.attributes('aria-label')

    await button.trigger('click')

    expect(before).toMatch(/tema/i)
    expect(button.attributes('aria-label')).not.toBe(before)
    wrapper.unmount()
  })

  // ---------- Expandida e gaveta do celular

  it('shows the wordmark when expanded and only the mark when collapsed', async () => {
    const { wrapper } = await mountRail({ expanded: false })
    expect(wrapper.find('.wordmark').exists()).toBe(false)

    await wrapper.setProps({ expanded: true })

    expect(wrapper.find('.rail').classes()).toContain('expanded')
    expect(wrapper.find('.wordmark').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the mobile drawer shows an overlay that closes it, and Escape closes it too', async () => {
    const { wrapper } = await mountRail({ mobileOpen: true })

    expect(wrapper.find('.rail').classes()).toContain('open')
    expect(wrapper.find('.rail-overlay').exists()).toBe(true)

    await wrapper.find('.rail-overlay').trigger('click')
    expect(wrapper.emitted('update:mobileOpen')?.[0]).toEqual([false])

    await wrapper.find('.rail').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:mobileOpen')?.length).toBe(2)
    wrapper.unmount()
  })

  it('choosing a destination closes the drawer', async () => {
    const { wrapper } = await mountRail({ mobileOpen: true }, '/configuracoes')

    await item(wrapper, 'Notas').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:mobileOpen')?.some(e => e[0] === false)).toBe(true)
    wrapper.unmount()
  })

  it('opening the drawer moves the focus to the first item', async () => {
    const { wrapper } = await mountRail({ mobileOpen: false })

    await wrapper.setProps({ mobileOpen: true })
    await flushPromises()

    expect(document.activeElement).toBe(item(wrapper, 'Notas').element)
    wrapper.unmount()
  })
})

// Evita warnings de vi não usado em alguns ambientes
void vi
