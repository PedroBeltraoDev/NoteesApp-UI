import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import FolderNameDialog from '@/components/notes/FolderNameDialog.vue'

// O Dialog do PrimeVue precisa do plugin e de DOM completo; aqui basta o contrato de v-model e slots
const PDialog = defineComponent({
  props: ['visible'],
  emits: ['update:visible'],
  setup: (_, { slots }) => () => h('div', { class: 'dialog-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()])
})

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(FolderNameDialog, { props: { isOpen: true, ...props }, global: { components: { PDialog } } })

const type = (wrapper: ReturnType<typeof mountDialog>, text: string) => wrapper.find('#folder-name').setValue(text)
const submit = (wrapper: ReturnType<typeof mountDialog>) => wrapper.find('form').trigger('submit')
const input = (wrapper: ReturnType<typeof mountDialog>) => wrapper.find('#folder-name').element as HTMLInputElement

describe('FolderNameDialog', () => {
  it('creating: titled "Nova pasta", empty field, "Criar pasta" button', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('#folder-dialog-title').text()).toBe('Nova pasta')
    expect(input(wrapper).value).toBe('')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Criar pasta')
  })

  it('renaming: titled "Renomear pasta" with the current name filled in', () => {
    const wrapper = mountDialog({ folder: { id: 4, name: 'Trabalho' } })

    expect(wrapper.find('#folder-dialog-title').text()).toBe('Renomear pasta')
    expect(input(wrapper).value).toBe('Trabalho')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Salvar')
  })

  it('the field is labelled, limited to 100 characters and focused when the dialog opens', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('label[for="folder-name"]').text()).toBe('Nome da pasta')
    expect(wrapper.find('#folder-name').attributes('maxlength')).toBe('100')
    expect(wrapper.find('#folder-name').attributes('autofocus')).toBeDefined()
  })

  it('saves the name with surrounding and repeated spaces cleaned', async () => {
    const wrapper = mountDialog()

    await type(wrapper, '  Minha    pasta  ')
    await submit(wrapper)

    expect(wrapper.emitted('save')).toEqual([['Minha pasta']])
  })

  it('a blank name is not sent and the error is announced and linked to the field', async () => {
    const wrapper = mountDialog()

    await type(wrapper, '   ')
    await submit(wrapper)

    expect(wrapper.emitted('save')).toBeUndefined()
    const error = wrapper.find('#folder-name-error')
    expect(error.text()).toBe('Dê um nome à pasta')
    expect(error.attributes('role')).toBe('alert')
    expect(wrapper.find('#folder-name').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#folder-name').attributes('aria-describedby')).toBe('folder-name-error')
  })

  it('the error goes away as soon as the user types', async () => {
    const wrapper = mountDialog()
    await submit(wrapper)
    expect(wrapper.find('#folder-name-error').exists()).toBe(true)

    await type(wrapper, 'Pronto')

    expect(wrapper.find('#folder-name-error').exists()).toBe(false)
  })

  it('shows the server error (repeated name) on the field, and clears it when the user edits', async () => {
    const wrapper = mountDialog()

    await wrapper.setProps({ error: 'Já existe uma pasta com esse nome' })
    expect(wrapper.find('#folder-name-error').text()).toBe('Já existe uma pasta com esse nome')

    await type(wrapper, 'Outro nome')
    expect(wrapper.find('#folder-name-error').exists()).toBe(false)
  })

  it('renaming to the same name just closes, without calling the server', async () => {
    const wrapper = mountDialog({ folder: { id: 4, name: 'Trabalho' } })

    await type(wrapper, '  Trabalho ')
    await submit(wrapper)

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('changing only the case counts as a rename (Trabalho -> trabalho)', async () => {
    const wrapper = mountDialog({ folder: { id: 4, name: 'Trabalho' } })

    await type(wrapper, 'trabalho')
    await submit(wrapper)

    expect(wrapper.emitted('save')).toEqual([['trabalho']])
  })

  it('while saving the button is disabled and a second submit is ignored', async () => {
    const wrapper = mountDialog({ saving: true })
    await type(wrapper, 'Ideias')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').text()).toBe('Salvando...')

    await submit(wrapper)
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('"Cancelar" and the dialog being dismissed both emit close', async () => {
    const wrapper = mountDialog()

    await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')
    wrapper.findComponent(PDialog).vm.$emit('update:visible', false)

    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('reopening starts clean, with no old text or error', async () => {
    const wrapper = mountDialog()
    await type(wrapper, 'Rascunho')
    await submit(wrapper)

    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    expect(input(wrapper).value).toBe('')
    expect(wrapper.find('#folder-name-error').exists()).toBe(false)
  })
})
