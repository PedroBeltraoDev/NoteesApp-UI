import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const PDialog = defineComponent({
  props: ['visible'],
  emits: ['update:visible'],
  setup: (_, { slots }) => () => h('div', { class: 'dialog-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()])
})

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(ConfirmDialog, {
    props: { isOpen: true, title: 'Excluir pasta?', message: 'As notas ficam sem pasta.', confirmLabel: 'Excluir pasta', ...props },
    global: { components: { PDialog } }
  })

const button = (wrapper: ReturnType<typeof mountDialog>, text: string) =>
  wrapper.findAll('button').find(b => b.text() === text)!

describe('ConfirmDialog', () => {
  it('shows the title, the message and the confirm label', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('#confirm-dialog-title').text()).toBe('Excluir pasta?')
    expect(wrapper.find('.message').text()).toBe('As notas ficam sem pasta.')
    expect(button(wrapper, 'Excluir pasta').exists()).toBe(true)
  })

  it('"Cancelar" is focused by default, so confirming by accident takes an extra gesture', () => {
    const wrapper = mountDialog()

    expect(button(wrapper, 'Cancelar').attributes('autofocus')).toBeDefined()
    expect(button(wrapper, 'Excluir pasta').attributes('autofocus')).toBeUndefined()
  })

  it('the confirm button emits confirm; "Cancelar" emits cancel', async () => {
    const wrapper = mountDialog()

    await button(wrapper, 'Excluir pasta').trigger('click')
    await button(wrapper, 'Cancelar').trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('dismissing the dialog (Esc, ✕, clicking outside) cancels', () => {
    const wrapper = mountDialog()

    wrapper.findComponent(PDialog).vm.$emit('update:visible', false)

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('while busy the confirm button is disabled and says what is happening', () => {
    const wrapper = mountDialog({ busy: true })

    const confirm = button(wrapper, 'Excluindo...')
    expect(confirm.attributes('disabled')).toBeDefined()
  })
})
