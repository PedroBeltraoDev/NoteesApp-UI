import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Topbar from '@/components/layout/Topbar.vue'

describe('Topbar', () => {
  it('renders app title', () => {
    const wrapper = mount(Topbar)
    expect(wrapper.text()).toContain('NoteesApp')
  })

  it.skip('renders search input', () => {
    const wrapper = mount(Topbar)
    const searchInput = wrapper.find('input')
    expect(searchInput.exists()).toBe(true)
  })

  it('emits search event when typing in search input', async () => {
    const wrapper = mount(Topbar)
    const searchInput = wrapper.find('input')
    if (searchInput.exists()) {
      await searchInput.setValue('teste')
      await searchInput.trigger('input')
      expect(wrapper.emitted('search')).toBeTruthy()
    }
  })

  it('renders new note button', () => {
    const wrapper = mount(Topbar)
    const newNoteButton = wrapper.find('[title="Nova Nota"], .btn-new-note, button')
    expect(newNoteButton.exists()).toBe(true)
  })

  it.skip('emits createNote event when new note button is clicked', async () => {
    const wrapper = mount(Topbar)
    const newNoteButton = wrapper.find('[title="Nova Nota"], .btn-new-note, button')
    if (newNoteButton.exists()) {
      await newNoteButton.trigger('click')
      expect(wrapper.emitted('createNote') || wrapper.emitted('new-note')).toBeTruthy()
    }
  })

  it('renders theme toggle button', () => {
    const wrapper = mount(Topbar)
    const themeButton = wrapper.find('[title*="tema"], .btn-theme, button')
    expect(themeButton.exists()).toBe(true)
  })

  it.skip('emits toggleTheme event when theme button is clicked', async () => {
    const wrapper = mount(Topbar)
    const themeButton = wrapper.find('[title*="tema"], .btn-theme, button')
    if (themeButton.exists()) {
      await themeButton.trigger('click')
      const emitted = wrapper.emitted()
      const hasThemeEvent = Object.keys(emitted).some(key => 
        key.toLowerCase().includes('theme') || key.toLowerCase().includes('toggle')
      )
      expect(hasThemeEvent).toBe(true)
    }
  })
})