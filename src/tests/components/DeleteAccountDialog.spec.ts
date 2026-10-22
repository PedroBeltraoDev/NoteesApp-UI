import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DeleteAccountDialog from '@/components/common/DeleteAccountDialog.vue'

const PDialog = defineComponent({
  props: ['visible'],
  emits: ['update:visible'],
  setup: (_, { slots }) => () => h('div', { class: 'dialog-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()])
})

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(DeleteAccountDialog, {
    props: { isOpen: true, ...props },
    global: { components: { PDialog } },
    attachTo: document.body
  })

const button = (wrapper: ReturnType<typeof mountDialog>, text: string) =>
  wrapper.findAll('button').find(b => b.text() === text)!

describe('DeleteAccountDialog', () => {
  it('a regular account is asked for the password, and the warning says it is forever', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('#delete-account-title').text()).toBe('Excluir sua conta?')
    expect(wrapper.text()).toContain('para sempre')
    const input = wrapper.find('#delete-account-password')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('password')
    expect(input.attributes('autocomplete')).toBe('current-password')
    expect(input.attributes('autofocus')).toBeDefined()
  })

  it('the confirm button stays disabled until a password is typed', async () => {
    const wrapper = mountDialog()
    expect(button(wrapper, 'Excluir conta').attributes('disabled')).toBeDefined()

    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    expect(button(wrapper, 'Excluir conta').attributes('disabled')).toBeUndefined()
  })

  it('submitting (button or Enter) emits confirm with the password', async () => {
    const wrapper = mountDialog()
    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toEqual([['senha-segura-123']])
  })

  it('does not emit confirm with an empty password', async () => {
    const wrapper = mountDialog()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('a demo account has no password field and can confirm right away', async () => {
    const wrapper = mountDialog({ isDemo: true })

    expect(wrapper.find('#delete-account-password').exists()).toBe(false)
    expect(wrapper.text()).toContain('conta demo')
    expect(button(wrapper, 'Excluir conta').attributes('disabled')).toBeUndefined()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toEqual([['']])
  })

  it('in a demo, "Cancelar" gets the focus (confirming by accident takes an extra gesture)', () => {
    const wrapper = mountDialog({ isDemo: true })

    expect(button(wrapper, 'Cancelar').attributes('autofocus')).toBeDefined()
  })

  it('shows the server error as an alert tied to the field, and clears it when the person types again', async () => {
    const wrapper = mountDialog({ error: 'Senha incorreta' })

    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toBe('Senha incorreta')
    expect(wrapper.find('#delete-account-password').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#delete-account-password').attributes('aria-describedby')).toBe('delete-account-error')

    await wrapper.find('#delete-account-password').setValue('outra-tentativa')

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('a new error shows up again after the previous one was cleared by typing', async () => {
    const wrapper = mountDialog({ error: 'Senha incorreta' })
    await wrapper.find('#delete-account-password').setValue('x')

    await wrapper.setProps({ error: 'Erro no servidor. Tente novamente em instantes.' })

    expect(wrapper.find('[role="alert"]').text()).toBe('Erro no servidor. Tente novamente em instantes.')
  })

  it('"Cancelar", Esc, the ✕ and clicking outside emit cancel', async () => {
    const wrapper = mountDialog()

    await button(wrapper, 'Cancelar').trigger('click')
    wrapper.findComponent(PDialog).vm.$emit('update:visible', false)

    expect(wrapper.emitted('cancel')).toHaveLength(2)
  })

  it('while busy it cannot be dismissed or submitted again, and says what is happening', async () => {
    const wrapper = mountDialog({ busy: true })
    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    wrapper.findComponent(PDialog).vm.$emit('update:visible', false)
    await wrapper.find('form').trigger('submit')

    expect(button(wrapper, 'Excluindo...').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Cancelar').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('opening it again starts with an empty password', async () => {
    const wrapper = mountDialog()
    await wrapper.find('#delete-account-password').setValue('senha-segura-123')

    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    expect((wrapper.find('#delete-account-password').element as HTMLInputElement).value).toBe('')
  })

  it('after a failed attempt the focus goes back to the password field', async () => {
    const wrapper = mountDialog({ busy: true })
    await wrapper.find('#delete-account-password').setValue('errada-123456')

    await wrapper.setProps({ busy: false, error: 'Senha incorreta' })
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('#delete-account-password').element)
  })
})
