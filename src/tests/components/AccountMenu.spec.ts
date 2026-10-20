import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountMenu from '@/components/layout/AccountMenu.vue'

const mountMenu = () => mount(AccountMenu, { props: { email: 'pessoa@teste.com' }, attachTo: document.body })

describe('AccountMenu', () => {
  it('starts closed with an accessible trigger', () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button.account-btn')

    expect(trigger.attributes('aria-label')).toBe('Conta de pessoa@teste.com')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens showing the e-mail and both actions, focusing the first item', async () => {
    const wrapper = mountMenu()

    await wrapper.find('button.account-btn').trigger('click')

    expect(wrapper.find('button.account-btn').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('pessoa@teste.com')
    const items = wrapper.findAll('[role="menuitem"]')
    expect(items.map(i => i.text())).toEqual(['Configurações', 'Sair'])
    expect(document.activeElement).toBe(items[0]!.element)
    wrapper.unmount()
  })

  it('emits settings and closes', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')

    expect(wrapper.emitted('settings')).toHaveLength(1)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits logout and closes', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Escape closes and returns the focus to the trigger', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.find('.account-panel').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('button.account-btn').element)
    wrapper.unmount()
  })

  it('arrow keys move between items and wrap around', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')
    const items = wrapper.findAll('[role="menuitem"]')

    await wrapper.find('.account-panel').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1]!.element)

    await wrapper.find('.account-panel').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[0]!.element)

    await wrapper.find('.account-panel').trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[1]!.element)
    wrapper.unmount()
  })

  it('clicking outside closes it', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clicking the trigger again closes it', async () => {
    const wrapper = mountMenu()
    await wrapper.find('button.account-btn').trigger('click')

    await wrapper.find('button.account-btn').trigger('click')

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
