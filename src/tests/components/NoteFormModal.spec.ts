import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import NoteFormModal from '@/components/notes/NoteFormModal.vue'

// O Dialog do PrimeVue precisa do plugin e de DOM completo; aqui basta o contrato de v-model e slots
const PDialog = defineComponent({
  props: ['visible'],
  emits: ['update:visible'],
  setup: (_, { slots }) => () => h('div', { class: 'dialog-stub' }, [slots.header?.(), slots.default?.(), slots.footer?.()])
})

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(NoteFormModal, {
    props: { isOpen: true, note: null, folders: [], tags: [], ...props },
    global: { components: { PDialog } }
  })

type Wrapper = VueWrapper<any>

const existing = { id: 5, title: 'Nota existente', content: 'Conteúdo existente', folder: 'Trabalho', tags: ['api'], isPinned: false }

const button = (wrapper: Wrapper, text: string) => {
  const found = wrapper.findAll('button').find(b => b.text().replace(/\s+/g, ' ').trim() === text)
  if (!found) throw new Error(`Botão "${text}" não encontrado`)
  return found
}

const choices = (wrapper: Wrapper) => wrapper.findAll('.choice:not(.add)').map(c => c.text())
const activeChoice = (wrapper: Wrapper) => wrapper.find('.choice.active').text()
const chips = (wrapper: Wrapper) => wrapper.findAll('.chips .chip').map(c => c.text())
const suggestions = (wrapper: Wrapper) => wrapper.findAll('.chip.suggestion').map(c => c.text().replace('+', '').trim())

const typeTag = async (wrapper: Wrapper, text: string, key?: string) => {
  const input = wrapper.find('#note-tags')
  await input.setValue(text)
  if (key) await input.trigger('keydown', { key })
}

const addFolder = async (wrapper: Wrapper, name: string) => {
  await button(wrapper, 'Nova pasta').trigger('click')
  const input = wrapper.find('.choice-input')
  await input.setValue(name)
  await input.trigger('keydown', { key: 'Enter' })
}

const save = (wrapper: Wrapper) => button(wrapper, 'Salvar').trigger('click')

const saved = (wrapper: Wrapper) => wrapper.emitted('saved')![0]![0]

describe('NoteFormModal', () => {
  // ---------- Criar x editar

  it('has a create and an edit mode, and only the edit mode offers to delete', () => {
    const create = mountForm()
    const edit = mountForm({ note: existing })

    expect(create.find('#note-editor-title').text()).toBe('Nova nota')
    expect(edit.find('#note-editor-title').text()).toBe('Editar nota')
    expect(create.find('.editor-foot .btn-danger').exists()).toBe(false)
    expect(edit.find('.editor-foot .btn-danger').text()).toContain('Excluir')
  })

  it('loads the note being edited into the fields', () => {
    const wrapper = mountForm({ note: { ...existing, tags: ['api', 'vue'] }, folders: ['Trabalho'] })

    expect((wrapper.find('#note-title').element as HTMLInputElement).value).toBe('Nota existente')
    expect((wrapper.find('#note-content').element as HTMLTextAreaElement).value).toBe('Conteúdo existente')
    expect(activeChoice(wrapper)).toBe('Trabalho')
    expect(chips(wrapper)).toEqual(['api', 'vue'])
  })

  it('the delete button emits the note being edited', async () => {
    const wrapper = mountForm({ note: existing })

    await button(wrapper, 'Excluir').trigger('click')

    expect(wrapper.emitted('delete')![0]).toEqual([existing])
  })

  // ---------- Pasta: botões de escolha, sem lista flutuante

  it('offers the user real folders (sorted) as buttons, not a hardcoded list or a floating select', () => {
    const wrapper = mountForm({ folders: ['Trabalho', 'Ideias', 'Segredos'] })

    expect(choices(wrapper)).toEqual(['Sem pasta', 'Ideias', 'Segredos', 'Trabalho'])
    expect(choices(wrapper)).not.toContain('Aprendendo')
    expect(wrapper.find('.p-select').exists()).toBe(false)
    expect(activeChoice(wrapper)).toBe('Sem pasta')
  })

  it('folder buttons expose their state to assistive technology', () => {
    const wrapper = mountForm({ folders: ['Trabalho'] })

    expect(wrapper.find('[role="group"]').attributes('aria-labelledby')).toBe('note-folder-label')
    expect(wrapper.findAll('.choice:not(.add)').map(c => c.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })

  it('includes the folder of the note being edited even if the list lacks it', () => {
    const wrapper = mountForm({ folders: ['Ideias'], note: { ...existing, folder: 'Antiga' } })

    expect(choices(wrapper)).toContain('Antiga')
    expect(activeChoice(wrapper)).toBe('Antiga')
  })

  it('picking an existing folder saves the note in it', async () => {
    const wrapper = mountForm({ folders: ['Trabalho', 'Ideias'] })

    await wrapper.find('#note-title').setValue('Nota')
    await button(wrapper, 'Ideias').trigger('click')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ folder: 'Ideias' })
  })

  it('"Sem pasta" saves the folder as null', async () => {
    const wrapper = mountForm({ folders: ['Trabalho'], note: existing })

    await button(wrapper, 'Sem pasta').trigger('click')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ folder: null })
  })

  it('creating a folder happens inline: type a name, press Enter, and it is selected', async () => {
    const wrapper = mountForm({ folders: ['Trabalho'] })

    await wrapper.find('#note-title').setValue('Roteiro')
    await addFolder(wrapper, '  Viagens  ')

    expect(choices(wrapper)).toEqual(['Sem pasta', 'Trabalho', 'Viagens'])
    expect(activeChoice(wrapper)).toBe('Viagens')
    expect(wrapper.find('.choice-input').exists()).toBe(false)

    await save(wrapper)
    expect(saved(wrapper)).toMatchObject({ folder: 'Viagens' })
  })

  it('typing the name of an existing folder (any case) selects it instead of duplicating', async () => {
    const wrapper = mountForm({ folders: ['Trabalho'] })

    await addFolder(wrapper, 'trabalho')

    expect(choices(wrapper)).toEqual(['Sem pasta', 'Trabalho'])
    expect(activeChoice(wrapper)).toBe('Trabalho')
  })

  it('Escape in the new-folder field cancels it without selecting anything', async () => {
    const wrapper = mountForm({ folders: ['Trabalho'] })

    await button(wrapper, 'Nova pasta').trigger('click')
    await wrapper.find('.choice-input').setValue('Rascunho')
    await wrapper.find('.choice-input').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('.choice-input').exists()).toBe(false)
    expect(choices(wrapper)).toEqual(['Sem pasta', 'Trabalho'])
  })

  it('a new folder name typed but not confirmed is still saved with the note', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('Nota')
    await button(wrapper, 'Nova pasta').trigger('click')
    await wrapper.find('.choice-input').setValue('Pessoal')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ folder: 'Pessoal' })
  })

  // ---------- Pré-preenchimento a partir do filtro ativo

  it('a new note starts in the folder and with the tag the user is filtering by', () => {
    const wrapper = mountForm({ folders: ['Trabalho', 'Ideias'], defaultFolder: 'Ideias', defaultTag: 'urgente' })

    expect(activeChoice(wrapper)).toBe('Ideias')
    expect(chips(wrapper)).toEqual(['urgente'])
  })

  it('the defaults are ignored when editing', () => {
    const wrapper = mountForm({ note: existing, folders: ['Trabalho', 'Ideias'], defaultFolder: 'Ideias', defaultTag: 'urgente' })

    expect(activeChoice(wrapper)).toBe('Trabalho')
    expect(chips(wrapper)).toEqual(['api'])
  })

  it('the pre-filled defaults do not count as unsaved changes', async () => {
    const wrapper = mountForm({ defaultFolder: 'Ideias', defaultTag: 'urgente', folders: ['Ideias'] })

    await button(wrapper, 'Cancelar').trigger('click')

    expect(wrapper.find('.discard').exists()).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  // ---------- Tags: chips

  it('Enter turns the typed text into a tag and clears the field', async () => {
    const wrapper = mountForm()

    await typeTag(wrapper, 'vue', 'Enter')

    expect(chips(wrapper)).toEqual(['vue'])
    expect((wrapper.find('#note-tags').element as HTMLInputElement).value).toBe('')
  })

  it('a comma closes the tag, and pasting "a, b, c" creates three', async () => {
    const wrapper = mountForm()

    await typeTag(wrapper, 'roteiro,')
    expect(chips(wrapper)).toEqual(['roteiro'])

    await typeTag(wrapper, 'a, b, c')
    expect(chips(wrapper)).toEqual(['roteiro', 'a', 'b'])
    expect((wrapper.find('#note-tags').element as HTMLInputElement).value).toBe('c')
  })

  it('ignores a repeated tag, whatever its case', async () => {
    const wrapper = mountForm({ note: { ...existing, tags: ['Vue'] } })

    await typeTag(wrapper, 'vue', 'Enter')

    expect(chips(wrapper)).toEqual(['Vue'])
  })

  it('Backspace on an empty field removes the last tag; the ✕ removes a specific one', async () => {
    const wrapper = mountForm({ note: { ...existing, tags: ['a', 'b', 'c'] } })

    await wrapper.find('#note-tags').trigger('keydown', { key: 'Backspace' })
    expect(chips(wrapper)).toEqual(['a', 'b'])

    await wrapper.find('button[aria-label="Remover a tag a"]').trigger('click')
    expect(chips(wrapper)).toEqual(['b'])
  })

  it('suggests tags the user already has, minus the ones on the note, filtered by what is typed', async () => {
    const wrapper = mountForm({ tags: ['dotnet', 'di', 'reunião'], note: { ...existing, tags: ['di'] } })

    expect(suggestions(wrapper)).toEqual(['dotnet', 'reunião'])

    await wrapper.find('#note-tags').setValue('dot')
    expect(suggestions(wrapper)).toEqual(['dotnet'])
  })

  it('clicking a suggestion adds the tag', async () => {
    const wrapper = mountForm({ tags: ['dotnet'] })

    await wrapper.find('.chip.suggestion').trigger('click')

    expect(chips(wrapper)).toEqual(['dotnet'])
    expect(suggestions(wrapper)).toEqual([])
  })

  it('a tag typed but not confirmed is still saved with the note', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('Nota')
    await typeTag(wrapper, 'esquecida')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ tags: ['esquecida'] })
  })

  it('does not accept more than 20 tags and says why', async () => {
    const wrapper = mountForm({ note: { ...existing, tags: Array.from({ length: 20 }, (_, i) => `t${i}`) } })

    await typeTag(wrapper, 'extra', 'Enter')

    expect(chips(wrapper)).toHaveLength(20)
    expect(wrapper.find('#note-tags-error').text()).toContain('no máximo 20 tags')
    expect(wrapper.find('#note-tags-error').attributes('role')).toBe('alert')
  })

  it('the tag field limits each tag to 50 characters', () => {
    const wrapper = mountForm()

    expect(wrapper.find('#note-tags').attributes('maxlength')).toBe('50')
  })

  // ---------- Título e anotação

  it('only the title is required: a note without content can be saved', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('Pagar a conta de luz')
    await save(wrapper)

    expect(saved(wrapper)).toEqual({ title: 'Pagar a conta de luz', content: '', folder: null, tags: [], isPinned: false })
  })

  it('a short note is fine (no minimum length for title or content)', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('OK')
    await wrapper.find('#note-content').setValue('Sim')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ title: 'OK', content: 'Sim' })
  })

  it('trims title and content', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('  Título  ')
    await wrapper.find('#note-content').setValue('  Texto  \n')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ title: 'Título', content: 'Texto' })
  })

  it('without a title it does not save, and the error is announced and linked to the field', async () => {
    const wrapper = mountForm()

    await wrapper.find('#note-title').setValue('   ')
    await save(wrapper)

    expect(wrapper.emitted('saved')).toBeUndefined()
    const error = wrapper.find('#note-title-error')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toBe('Dê um título à nota')
    expect(wrapper.find('#note-title').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#note-title').attributes('aria-describedby')).toBe('note-title-error')
  })

  it('the title error goes away as soon as the user types', async () => {
    const wrapper = mountForm()
    await save(wrapper)
    expect(wrapper.find('#note-title-error').exists()).toBe(true)

    await wrapper.find('#note-title').setValue('Agora sim')

    expect(wrapper.find('#note-title-error').exists()).toBe(false)
  })

  it('the field limits match the API: title 200, content 1000, folder 100', async () => {
    const wrapper = mountForm()

    expect(wrapper.find('#note-title').attributes('maxlength')).toBe('200')
    expect(wrapper.find('#note-content').attributes('maxlength')).toBe('1000')

    await button(wrapper, 'Nova pasta').trigger('click')
    expect(wrapper.find('.choice-input').attributes('maxlength')).toBe('100')
  })

  it('shows the content counter only when it gets close to the limit', async () => {
    const wrapper = mountForm()
    expect(wrapper.find('.counter').exists()).toBe(false)

    await wrapper.find('#note-content').setValue('a'.repeat(850))

    expect(wrapper.find('.counter').text()).toBe('850/1000')
  })

  it('Enter in the title moves to the content instead of submitting', async () => {
    const wrapper = mount(NoteFormModal, {
      props: { isOpen: true, note: null },
      global: { components: { PDialog } },
      attachTo: document.body
    })

    await wrapper.find('#note-title').setValue('Título')
    await wrapper.find('#note-title').trigger('keydown', { key: 'Enter' })

    expect(document.activeElement?.id).toBe('note-content')
    expect(wrapper.emitted('saved')).toBeUndefined()
    wrapper.unmount()
  })

  // ---------- Favorita

  it('the star in the header marks the note as favorite', async () => {
    const wrapper = mountForm()
    const star = wrapper.find('.fav-toggle')
    expect(star.attributes('aria-pressed')).toBe('false')

    await wrapper.find('#note-title').setValue('Nota')
    await star.trigger('click')
    await save(wrapper)

    expect(star.attributes('aria-pressed')).toBe('true')
    expect(saved(wrapper)).toMatchObject({ isPinned: true })
  })

  it('editing a favorite note keeps it a favorite (it used to unpin it)', async () => {
    const wrapper = mountForm({ note: { ...existing, isPinned: true } })

    await wrapper.find('#note-title').setValue('Editada')
    await save(wrapper)

    expect(saved(wrapper)).toMatchObject({ title: 'Editada', isPinned: true })
  })

  // ---------- Atalho e salvamento

  it('Ctrl+Enter saves from any field', async () => {
    const wrapper = mountForm()
    await wrapper.find('#note-title').setValue('Nota rápida')

    await wrapper.find('#note-content').trigger('keydown', { key: 'Enter', ctrlKey: true })

    expect(saved(wrapper)).toMatchObject({ title: 'Nota rápida' })
  })

  it('while the parent is saving the button is disabled and a second submit is ignored', async () => {
    const wrapper = mountForm({ saving: true })
    await wrapper.find('#note-title').setValue('Nota')

    const submit = wrapper.find('.btn-primary')
    expect(submit.text()).toBe('Salvando...')
    expect(submit.attributes('disabled')).toBeDefined()

    await wrapper.find('#note-content').trigger('keydown', { key: 'Enter', ctrlKey: true })
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  // ---------- Fechar sem perder o que foi digitado

  it('closing a form with nothing typed closes right away', async () => {
    const wrapper = mountForm()

    await button(wrapper, 'Cancelar').trigger('click')

    expect(wrapper.find('.discard').exists()).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closing with unsaved changes asks first, and "Continuar editando" keeps everything', async () => {
    const wrapper = mountForm()
    await wrapper.find('#note-title').setValue('Quase esqueci')

    await button(wrapper, 'Cancelar').trigger('click')

    expect(wrapper.find('.discard').text()).toContain('Descartar o que você escreveu?')
    expect(wrapper.find('.discard').attributes('role')).toBe('alert')
    expect(wrapper.emitted('close')).toBeUndefined()

    await button(wrapper, 'Continuar editando').trigger('click')

    expect(wrapper.find('.discard').exists()).toBe(false)
    expect((wrapper.find('#note-title').element as HTMLInputElement).value).toBe('Quase esqueci')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('"Descartar" closes the form', async () => {
    const wrapper = mountForm()
    await wrapper.find('#note-title').setValue('Descartável')
    await button(wrapper, 'Cancelar').trigger('click')

    await button(wrapper, 'Descartar').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('Escape, the ✕ and clicking outside also ask when there are unsaved changes', async () => {
    const wrapper = mountForm({ note: existing })
    await wrapper.find('#note-content').setValue('Mudei o texto')

    wrapper.findComponent(PDialog).vm.$emit('update:visible', false)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.discard').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('typing in the tag or folder field counts as a change worth protecting', async () => {
    const tag = mountForm()
    await typeTag(tag, 'pendente')
    await button(tag, 'Cancelar').trigger('click')
    expect(tag.find('.discard').exists()).toBe(true)

    const folder = mountForm()
    await button(folder, 'Nova pasta').trigger('click')
    await folder.find('.choice-input').setValue('Pendente')
    await button(folder, 'Cancelar').trigger('click')
    expect(folder.find('.discard').exists()).toBe(true)
  })

  it('reopening starts from a clean form', async () => {
    const wrapper = mountForm()
    await wrapper.find('#note-title').setValue('Antiga')

    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    expect((wrapper.find('#note-title').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('.discard').exists()).toBe(false)
  })
})
