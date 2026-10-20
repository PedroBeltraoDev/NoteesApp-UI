import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KebabMenu from '@/components/common/KebabMenu.vue'

const items = [
  { key: 'open', label: 'Abrir', icon: 'pi pi-eye' },
  { key: 'edit', label: 'Editar', icon: 'pi pi-pencil' },
  { key: 'delete', label: 'Excluir', icon: 'pi pi-trash', danger: true }
]

const mountMenu = () => mount(KebabMenu, { props: { items, label: 'Mais ações para Nota' }, attachTo: document.body })

describe('KebabMenu', () => {
  it('starts closed with an accessible trigger', () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('.kebab-trigger')

    expect(trigger.attributes('aria-label')).toBe('Mais ações para Nota')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens a labelled menu with the items and focuses the first one', async () => {
    const wrapper = mountMenu()

    await wrapper.find('.kebab-trigger').trigger('click')

    expect(wrapper.find('.kebab-trigger').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="menu"]').attributes('aria-label')).toBe('Mais ações para Nota')
    const buttons = wrapper.findAll('[role="menuitem"]')
    expect(buttons.map(b => b.text())).toEqual(['Abrir', 'Editar', 'Excluir'])
    expect(document.activeElement).toBe(buttons[0]!.element)
    wrapper.unmount()
  })

  it('marks the destructive item', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.kebab-trigger').trigger('click')

    const buttons = wrapper.findAll('[role="menuitem"]')

    expect(buttons[2]!.classes()).toContain('danger')
    expect(buttons[0]!.classes()).not.toContain('danger')
    wrapper.unmount()
  })

  it('emits select with the item key and closes', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.kebab-trigger').trigger('click')

    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['edit'])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('Escape closes and returns the focus to the trigger', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.kebab-trigger').trigger('click')

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.kebab-trigger').element)
    wrapper.unmount()
  })

  it('arrow keys, Home and End move between items', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.kebab-trigger').trigger('click')
    const buttons = wrapper.findAll('[role="menuitem"]')
    const menu = wrapper.find('[role="menu"]')

    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[1]!.element)

    await menu.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(buttons[2]!.element)

    await menu.trigger('keydown', { key: 'ArrowDown' }) // dá a volta
    expect(document.activeElement).toBe(buttons[0]!.element)

    await menu.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(buttons[2]!.element)
    wrapper.unmount()
  })

  it('clicking outside closes it', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.kebab-trigger').trigger('click')

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opening the menu does not bubble the click to the parent (e.g. the card)', async () => {
    let parentClicks = 0
    const wrapper = mount(
      {
        components: { KebabMenu },
        data: () => ({ items }),
        methods: { onParent() { parentClicks++ } },
        template: '<div @click="onParent"><KebabMenu :items="items" label="Mais" /></div>'
      },
      { attachTo: document.body }
    )

    await wrapper.find('.kebab-trigger').trigger('click')
    await wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')

    expect(parentClicks).toBe(0)
    wrapper.unmount()
  })
})
