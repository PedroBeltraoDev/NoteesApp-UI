import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Topbar from '@/components/layout/Topbar.vue'

describe('Topbar', () => {
  it('shows the page title as the page heading', () => {
    const wrapper = mount(Topbar, { props: { title: 'Notas' } })

    expect(wrapper.find('h1').text()).toBe('Notas')
  })

  it('emits search when typing in the search field', async () => {
    const wrapper = mount(Topbar)

    await wrapper.find('#search-desktop').setValue('teste')

    expect(wrapper.emitted('search')?.[0]).toEqual(['teste'])
  })

  it('hides the search on pages that do not use it', () => {
    const wrapper = mount(Topbar, { props: { showSearch: false } })

    expect(wrapper.find('#search-desktop').exists()).toBe(false)
    expect(wrapper.find('button.btn-search-toggle').exists()).toBe(false)
  })

  it('emits toggleNav from the menu button', async () => {
    const wrapper = mount(Topbar)

    await wrapper.find('button.menu-btn').trigger('click')

    expect(wrapper.emitted('toggleNav')).toHaveLength(1)
  })

  it('the menu button tells screen readers whether the menu is open', async () => {
    const wrapper = mount(Topbar, { props: { navOpen: false } })
    const button = wrapper.find('button.menu-btn')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Abrir o menu')

    await wrapper.setProps({ navOpen: true })

    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-label')).toBe('Fechar o menu')
  })
})
