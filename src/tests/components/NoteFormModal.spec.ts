import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import NoteFormModal from '@/components/notes/NoteFormModal.vue'

// Os componentes do PrimeVue precisam do plugin e de DOM completo; aqui basta o contrato de v-model/slots
const PDialog = defineComponent({
  props: ['visible', 'header'],
  setup: (_, { slots }) => () => h('div', { class: 'dialog-stub' }, [slots.default?.(), slots.footer?.()])
})

const PInputText = defineComponent({
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: false,
  setup: (props, { emit, attrs }) => () =>
    h('input', { ...attrs, value: props.modelValue, onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value) })
})

const Textarea = defineComponent({
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: false,
  setup: (props, { emit, attrs }) => () =>
    h('textarea', { ...attrs, value: props.modelValue, onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value) })
})

// O Select registra as opções e o valor para os testes inspecionarem
const PSelect = defineComponent({
  // `editable` é Boolean no PrimeVue: o atributo sem valor chega como true
  props: { modelValue: String, options: Array, editable: Boolean, inputId: String },
  emits: ['update:modelValue'],
  inheritAttrs: false,
  setup: (props, { emit }) => () =>
    h('input', {
      class: 'select-stub',
      id: props.inputId,
      'data-editable': String(!!props.editable),
      'data-options': JSON.stringify((props.options ?? []).map((o: any) => o.label)),
      value: props.modelValue,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    })
})

const PButton = defineComponent({
  props: ['label'],
  emits: ['click'],
  setup: (props, { emit }) => () => h('button', { class: `btn-${props.label}`, onClick: () => emit('click') }, props.label)
})

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(NoteFormModal, {
    props: { isOpen: true, note: null, folders: [], ...props },
    global: { components: { PDialog, PInputText, Textarea, PSelect, PButton } }
  })

const fill = async (wrapper: ReturnType<typeof mount>, values: { title?: string; content?: string; folder?: string; tags?: string }) => {
  if (values.title !== undefined) await wrapper.find('#title').setValue(values.title)
  if (values.content !== undefined) await wrapper.find('#content').setValue(values.content)
  if (values.folder !== undefined) await wrapper.find('.select-stub').setValue(values.folder)
  if (values.tags !== undefined) await wrapper.find('#tags').setValue(values.tags)
}

const valid = { title: 'Título válido', content: 'Conteúdo válido com mais de dez caracteres' }

describe('NoteFormModal', () => {
  it('offers the user real folders (sorted), not a hardcoded list', () => {
    const wrapper = mountForm({ folders: ['Trabalho', 'Ideias', 'Segredos'] })

    const options = JSON.parse(wrapper.find('.select-stub').attributes('data-options')!)

    expect(options).toEqual(['Sem pasta', 'Ideias', 'Segredos', 'Trabalho'])
    expect(options).not.toContain('Aprendendo') // fazia parte da lista fixa antiga
  })

  it('the folder field is editable, so a new folder can be created by typing', () => {
    const wrapper = mountForm()

    expect(wrapper.find('.select-stub').attributes('data-editable')).toBe('true')
    expect(wrapper.find('label[for="folder"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('digite um nome novo')
  })

  it('includes the folder of the note being edited even if the list lacks it', () => {
    const wrapper = mountForm({ folders: ['Trabalho'], note: { id: 1, title: 'x', content: 'y', folder: 'Antiga', tags: [], isPinned: false } })

    expect(JSON.parse(wrapper.find('.select-stub').attributes('data-options')!)).toContain('Antiga')
  })

  it('saves a note in a brand-new folder typed by the user', async () => {
    const wrapper = mountForm({ folders: ['Trabalho'] })

    await fill(wrapper, { ...valid, folder: '  Viagens  ', tags: 'roteiro, 2027' })
    await wrapper.find('.btn-Salvar').trigger('click')

    expect(wrapper.emitted('saved')![0]![0]).toEqual({
      title: 'Título válido',
      content: 'Conteúdo válido com mais de dez caracteres',
      folder: 'Viagens',
      tags: ['roteiro', '2027'],
      isPinned: false
    })
  })

  it('an empty folder is saved as null', async () => {
    const wrapper = mountForm()

    await fill(wrapper, { ...valid, folder: '' })
    await wrapper.find('.btn-Salvar').trigger('click')

    expect(wrapper.emitted('saved')![0]![0]).toMatchObject({ folder: null })
  })

  it('editing a pinned note keeps it pinned (it used to unpin it)', async () => {
    const wrapper = mountForm({
      note: { id: 5, title: 'Nota fixada', content: 'Conteúdo da nota fixada', folder: null, tags: [], isPinned: true }
    })

    await fill(wrapper, { title: 'Nota fixada editada' })
    await wrapper.find('.btn-Salvar').trigger('click')

    expect(wrapper.emitted('saved')![0]![0]).toMatchObject({ title: 'Nota fixada editada', isPinned: true })
  })

  it('editing an unpinned note keeps it unpinned', async () => {
    const wrapper = mountForm({
      note: { id: 6, title: 'Nota comum', content: 'Conteúdo da nota comum', folder: null, tags: [], isPinned: false }
    })

    await wrapper.find('.btn-Salvar').trigger('click')

    expect(wrapper.emitted('saved')![0]![0]).toMatchObject({ isPinned: false })
  })

  it('rejects a folder name above the API limit', async () => {
    const wrapper = mountForm()

    await fill(wrapper, { ...valid, folder: 'a'.repeat(101) })
    await wrapper.find('.btn-Salvar').trigger('click')

    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(wrapper.text()).toContain('no máximo 100 caracteres')
  })

  it('rejects more than 20 tags or tags above 50 characters', async () => {
    const wrapper = mountForm()

    await fill(wrapper, { ...valid, tags: Array.from({ length: 21 }, (_, i) => `t${i}`).join(',') })
    await wrapper.find('.btn-Salvar').trigger('click')
    expect(wrapper.text()).toContain('no máximo 20 tags')

    await fill(wrapper, { tags: 'a'.repeat(51) })
    await wrapper.find('.btn-Salvar').trigger('click')
    expect(wrapper.text()).toContain('no máximo 50 caracteres')

    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('field errors are announced and linked to their fields', async () => {
    const wrapper = mountForm()

    await wrapper.find('.btn-Salvar').trigger('click')

    const titleError = wrapper.find('#title-error')
    expect(titleError.attributes('role')).toBe('alert')
    expect(wrapper.find('#title').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#title').attributes('aria-describedby')).toBe('title-error')
    expect(wrapper.find('#content-error').exists()).toBe(true)
  })
})
