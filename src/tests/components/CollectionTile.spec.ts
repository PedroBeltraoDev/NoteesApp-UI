import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CollectionTile from '@/components/common/CollectionTile.vue'

const mountTile = (props: Record<string, unknown> = {}) =>
  mount(CollectionTile, { props: { name: 'Trabalho', count: 3, ...props }, attachTo: document.body })

describe('CollectionTile', () => {
  it('shows the name and how many notes it has', () => {
    const wrapper = mountTile()

    expect(wrapper.find('.tile-name').text()).toBe('Trabalho')
    expect(wrapper.find('.tile-count').text()).toBe('3 notas')
    wrapper.unmount()
  })

  it('uses the singular for one note and "0 notas" for none', () => {
    const one = mountTile({ count: 1 })
    const none = mountTile({ count: 0 })

    expect(one.find('.tile-count').text()).toBe('1 nota')
    expect(none.find('.tile-count').text()).toBe('0 notas')
    one.unmount()
    none.unmount()
  })

  it('the open button is a real button whose name has the name and the count', () => {
    const wrapper = mountTile()

    const open = wrapper.find('button.tile-open')
    // O separador oculto evita que o leitor de tela leia "Trabalho3 notas" junto
    expect(open.text().replace(/\s+/g, ' ')).toBe('Trabalho, 3 notas')
    wrapper.unmount()
  })

  it('clicking it emits open', async () => {
    const wrapper = mountTile()

    await wrapper.find('button.tile-open').trigger('click')

    expect(wrapper.emitted('open')).toHaveLength(1)
    wrapper.unmount()
  })

  it('has no ⋮ menu unless it is given menu items (tags have none)', () => {
    const wrapper = mountTile()

    expect(wrapper.find('.kebab-trigger').exists()).toBe(false)
    wrapper.unmount()
  })

  it('the ⋮ menu says which tile it belongs to and emits the chosen action, without opening the tile', async () => {
    const wrapper = mountTile({
      menuItems: [
        { key: 'rename', label: 'Renomear', icon: 'pi pi-pencil' },
        { key: 'delete', label: 'Excluir pasta', icon: 'pi pi-trash', danger: true }
      ]
    })
    expect(wrapper.find('.kebab-trigger').attributes('aria-label')).toBe('Mais ações para Trabalho')

    await wrapper.find('.kebab-trigger').trigger('click')
    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('menu')).toEqual([['delete']])
    expect(wrapper.emitted('open')).toBeUndefined()
    wrapper.unmount()
  })

  it('takes the color and icon it is given', () => {
    const wrapper = mountTile({ icon: 'pi pi-hashtag', color: 'var(--note-sky)' })

    expect(wrapper.find('.tile-icon i').classes()).toContain('pi-hashtag')
    expect(wrapper.find('.tile').attributes('style')).toContain('--tile-color: var(--note-sky)')
    wrapper.unmount()
  })
})
