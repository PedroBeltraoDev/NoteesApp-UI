import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import { api } from '@/services/api'

vi.mock('@/services/api', () => ({
  api: {
    getNotes: vi.fn(),
    getFolders: vi.fn(),
    getTags: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn()
  }
}))

const toastAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))

const notes = [
  { id: 1, title: 'Reunião de planejamento', content: 'Revisar metas do trimestre', createdAt: '2026-10-20T10:00:00Z', tags: ['importante'], folder: 'Trabalho', isPinned: false },
  { id: 2, title: 'Receita de bolo', content: 'Misture ovos e farinha', createdAt: '2026-10-19T10:00:00Z', tags: [], folder: null, isPinned: true }
]

// A tela muda as notas na hora (estrela), então cada teste recebe cópias novas para um não contaminar o outro
const freshNotes = () => notes.map(n => ({ ...n, tags: [...n.tags] }))

// O shell (barra lateral, cabeçalho, sessão, router) é testado à parte; aqui interessam as props que o Dashboard
// passa para ele, os eventos que recebe e o conteúdo do painel (slot)
const AppShellStub = defineComponent({
  name: 'AppShell',
  props: ['title', 'search', 'showSearch', 'showFilters', 'folders', 'tags', 'selectedFolder', 'selectedTag'],
  emits: ['search', 'selectFolder', 'selectTag', 'clearFilters'],
  setup: (_, { slots }) => () => h('div', { class: 'shell-stub' }, slots.default?.())
})

const FormStub = defineComponent({
  name: 'NoteFormModal',
  props: ['isOpen', 'note', 'folders', 'tags', 'defaultFolder', 'defaultTag', 'saving'],
  emits: ['close', 'saved', 'delete'],
  setup: () => () => h('div', { class: 'form-stub' })
})

const mountDashboard = async () => {
  const wrapper = mount(DashboardView, {
    global: { stubs: { AppShell: AppShellStub, NoteFormModal: FormStub } }
  })
  await flushPromises()
  return wrapper
}

const shell = (wrapper: ReturnType<typeof mount>) => wrapper.findComponent(AppShellStub)
const titles = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.note-title').map(t => t.text())
const form = (wrapper: ReturnType<typeof mount>) => wrapper.findComponent(FormStub)

// Exclui pelo menu ⋮ do cartão na posição `index` da lista
const deleteFromMenu = async (wrapper: ReturnType<typeof mount>, index = 0) => {
  const card = wrapper.findAll('.note-card')[index]!
  await card.find('.kebab-trigger').trigger('click')
  await card.findAll('[role="menuitem"]').find(i => i.text() === 'Excluir')!.trigger('click')
  await flushPromises()
}

const undoBar = (wrapper: ReturnType<typeof mount>) => wrapper.find('.undo-bar')

describe('DashboardView', () => {
  beforeEach(() => {
    vi.mocked(api.getNotes).mockReset().mockResolvedValue(freshNotes() as any)
    vi.mocked(api.getFolders).mockReset().mockResolvedValue(['Trabalho', 'Pessoal'])
    vi.mocked(api.getTags).mockReset().mockResolvedValue(['importante'])
    vi.mocked(api.createNote).mockReset()
    vi.mocked(api.updateNote).mockReset()
    vi.mocked(api.deleteNote).mockReset()
    toastAdd.mockClear()
  })

  it('shows the notes inside the shell, titled "Notas"', async () => {
    const wrapper = await mountDashboard()

    expect(shell(wrapper).props('title')).toBe('Notas')
    // Favoritas primeiro, depois as mais recentes
    expect(titles(wrapper)).toEqual(['Receita de bolo', 'Reunião de planejamento'])
  })

  it('asks the shell for search and the folder/tag filters, passing the real data', async () => {
    const wrapper = await mountDashboard()

    expect(shell(wrapper).props('showSearch')).toBe(true)
    expect(shell(wrapper).props('showFilters')).toBe(true)
    expect(shell(wrapper).props('folders')).toEqual(['Trabalho', 'Pessoal'])
    expect(shell(wrapper).props('tags')).toEqual(['importante'])
  })

  it('passes the real folders and tags to the form', async () => {
    const wrapper = await mountDashboard()

    expect(form(wrapper).props('folders')).toEqual(['Trabalho', 'Pessoal'])
    expect(form(wrapper).props('tags')).toEqual(['importante'])
  })

  // ---------- Abas

  it('has "Todas as notas" and "Favoritas" tabs with counts', async () => {
    const wrapper = await mountDashboard()

    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs.map(t => t.text().replace(/\s+/g, ' '))).toEqual(['Todas as notas 2(2)', 'Favoritas 1(1)'])
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(tabs[1]!.attributes('aria-selected')).toBe('false')
  })

  it('the Favoritas tab shows only favorite notes', async () => {
    const wrapper = await mountDashboard()

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

    expect(titles(wrapper)).toEqual(['Receita de bolo'])
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true')
  })

  it('arrow keys move between tabs and the panel follows', async () => {
    const wrapper = await mountDashboard()

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe('tab-favorites')

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('aria-selected')).toBe('true')
  })

  it('only the selected tab is in the tab order (roving tabindex)', async () => {
    const wrapper = await mountDashboard()

    expect(wrapper.findAll('[role="tab"]').map(t => t.attributes('tabindex'))).toEqual(['0', '-1'])
  })

  it('an empty Favoritas tab explains how to favorite and goes back to all notes', async () => {
    vi.mocked(api.getNotes).mockResolvedValue([freshNotes()[0]] as any)
    const wrapper = await mountDashboard()

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

    expect(wrapper.find('.empty-state').text()).toContain('Nenhuma favorita ainda')
    await wrapper.find('.empty-action').trigger('click')
    expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
  })

  it('the "Nova nota" button opens the form', async () => {
    const wrapper = await mountDashboard()

    await wrapper.find('.btn-add').trigger('click')

    expect(wrapper.findComponent(FormStub).props('isOpen')).toBe(true)
    expect(wrapper.findComponent(FormStub).props('note')).toBeNull()
  })

  // ---------- Busca

  it('search filters without losing notes: deleting letters brings them back', async () => {
    const wrapper = await mountDashboard()

    shell(wrapper).vm.$emit('search', 'bolo')
    await flushPromises()
    expect(titles(wrapper)).toEqual(['Receita de bolo'])

    shell(wrapper).vm.$emit('search', 'bo')
    await flushPromises()
    expect(titles(wrapper)).toEqual(['Receita de bolo'])

    // "b" também aparece em "Trabalho": a nota que tinha sumido da tela volta
    shell(wrapper).vm.$emit('search', 'b')
    await flushPromises()
    expect(titles(wrapper)).toHaveLength(2)

    shell(wrapper).vm.$emit('search', '')
    await flushPromises()
    expect(titles(wrapper)).toHaveLength(2)
    expect(api.getNotes).toHaveBeenCalledTimes(1) // não precisa ir ao servidor
  })

  it('search ignores accents and case', async () => {
    const wrapper = await mountDashboard()

    shell(wrapper).vm.$emit('search', 'REUNIAO')
    await flushPromises()

    expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
  })

  it('a search with no match says so and lets the user clear it', async () => {
    const wrapper = await mountDashboard()

    shell(wrapper).vm.$emit('search', 'zzz')
    await flushPromises()

    expect(wrapper.find('.empty-state').text()).toContain('Nenhum resultado')
    expect(wrapper.find('.empty-state').text()).toContain('zzz')
    expect(wrapper.find('.empty-state').text()).not.toContain('Nenhuma nota ainda')

    await wrapper.find('.empty-action').trigger('click')

    expect(titles(wrapper)).toHaveLength(2)
    expect(shell(wrapper).props('search')).toBe('')
  })

  it('search works together with the Favoritas tab', async () => {
    const wrapper = await mountDashboard()
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

    shell(wrapper).vm.$emit('search', 'reuniao')
    await flushPromises()

    // "Reunião" não é favorita: nenhum resultado dentro de Favoritas
    expect(wrapper.find('.empty-state').text()).toContain('Nenhum resultado')
  })

  // ---------- Estados vazios

  it('an account without notes gets a call to action instead of a misleading search message', async () => {
    vi.mocked(api.getNotes).mockResolvedValue([])
    const wrapper = await mountDashboard()

    expect(wrapper.find('.empty-state').text()).toContain('Nenhuma nota ainda')
    await wrapper.find('.empty-action').trigger('click')

    expect(wrapper.findComponent(FormStub).props('isOpen')).toBe(true)
  })

  it('a folder without notes says so and offers to clear the filter', async () => {
    const wrapper = await mountDashboard()
    vi.mocked(api.getNotes).mockResolvedValue([])

    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    expect(api.getNotes).toHaveBeenLastCalledWith('Trabalho', undefined)
    expect(shell(wrapper).props('selectedFolder')).toBe('Trabalho')
    expect(wrapper.find('.empty-state').text()).toContain('Nada em Pasta: Trabalho')

    vi.mocked(api.getNotes).mockResolvedValue(freshNotes() as any)
    await wrapper.find('.empty-action').trigger('click')
    await flushPromises()

    expect(titles(wrapper)).toHaveLength(2)
    expect(shell(wrapper).props('selectedFolder')).toBeNull()
  })

  it('selecting a tag filters by tag and clears the folder filter', async () => {
    const wrapper = await mountDashboard()

    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()
    shell(wrapper).vm.$emit('selectTag', 'importante')
    await flushPromises()

    expect(api.getNotes).toHaveBeenLastCalledWith(undefined, 'importante')
    expect(shell(wrapper).props('selectedFolder')).toBeNull()
    expect(shell(wrapper).props('selectedTag')).toBe('importante')
  })

  it('the active filter chip can be removed with an accessible button', async () => {
    const wrapper = await mountDashboard()
    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    const remove = wrapper.find('.clear-filter')

    expect(remove.attributes('aria-label')).toBe('Remover filtro')
    await remove.trigger('click')
    await flushPromises()
    expect(shell(wrapper).props('selectedFolder')).toBeNull()
  })

  // ---------- Mudanças

  it('a note saved in a brand-new folder makes the folder show up in the rail', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9 } as any)
    const wrapper = await mountDashboard()
    expect(shell(wrapper).props('folders')).toEqual(['Trabalho', 'Pessoal'])

    vi.mocked(api.getFolders).mockResolvedValue(['Trabalho', 'Pessoal', 'Viagens'])
    form(wrapper).vm.$emit('saved', {
      title: 'Roteiro', content: 'Passagens e hotel para a viagem', folder: 'Viagens', tags: [], isPinned: false
    })
    await flushPromises()

    expect(api.createNote).toHaveBeenCalledTimes(1)
    expect(api.getFolders).toHaveBeenCalledTimes(2) // carga inicial + depois de salvar
    expect(shell(wrapper).props('folders')).toContain('Viagens')
  })

  // ---------- Excluir com "Desfazer"

  describe('deleting', () => {
    afterEach(() => vi.useRealTimers())

    it('hides the note at once and offers to undo, without calling the API yet', async () => {
      const wrapper = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper) // 1ª da lista: "Receita de bolo"

      expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
      expect(undoBar(wrapper).text()).toContain('Receita de bolo')
      expect(undoBar(wrapper).attributes('role')).toBe('status')
      expect(api.deleteNote).not.toHaveBeenCalled()
    })

    it('there is no browser confirm() dialog anymore', async () => {
      const confirm = vi.fn(() => true)
      vi.stubGlobal('confirm', confirm)
      const wrapper = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)

      expect(confirm).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    it('after the undo window the note is deleted in the API and folders/tags are refreshed', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const wrapper = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)
      await vi.advanceTimersByTimeAsync(6000)

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(2)
      expect(api.getFolders).toHaveBeenCalledTimes(2)
      expect(api.getTags).toHaveBeenCalledTimes(2)
      expect(undoBar(wrapper).exists()).toBe(false)
    })

    it('"Desfazer" brings the note back and the API is never called', async () => {
      const wrapper = await mountDashboard()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)

      await wrapper.find('.undo-btn').trigger('click')
      await vi.advanceTimersByTimeAsync(10_000)

      expect(titles(wrapper)).toEqual(['Receita de bolo', 'Reunião de planejamento'])
      expect(undoBar(wrapper).exists()).toBe(false)
      expect(api.deleteNote).not.toHaveBeenCalled()
    })

    it('a note waiting to be deleted does not come back when the list reloads', async () => {
      const wrapper = await mountDashboard()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)

      shell(wrapper).vm.$emit('selectFolder', 'Trabalho') // o servidor ainda devolve as 2 notas
      await vi.advanceTimersByTimeAsync(0)

      expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
    })

    it('deleting a second note makes the first deletion final', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const wrapper = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper) // "Receita de bolo"
      vi.mocked(api.getNotes).mockResolvedValue([freshNotes()[0]] as any) // o servidor já não tem a 1ª
      await deleteFromMenu(wrapper) // agora "Reunião de planejamento"

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(2)
      expect(undoBar(wrapper).text()).toContain('Reunião de planejamento')
    })

    it('if the API refuses, the user is told and the note comes back', async () => {
      const { ApiError } = await import('@/services/http')
      vi.mocked(api.deleteNote).mockRejectedValue(new ApiError(500, 'Falha no servidor'))
      const wrapper = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)
      await vi.advanceTimersByTimeAsync(6000)

      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Falha no servidor' }))
      expect(titles(wrapper)).toEqual(['Receita de bolo', 'Reunião de planejamento'])
    })

    it('leaving the page with a pending deletion deletes right away', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const wrapper = await mountDashboard()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)

      wrapper.unmount()

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(2)
    })

    it('deleting from inside the editor closes it and goes through the same undo', async () => {
      const wrapper = await mountDashboard()
      vi.useFakeTimers()
      await wrapper.findAll('.note-card')[1]!.trigger('click') // abre "Reunião de planejamento" no editor
      expect(form(wrapper).props('isOpen')).toBe(true)

      form(wrapper).vm.$emit('delete', notes[0])
      await flushPromises()

      expect(form(wrapper).props('isOpen')).toBe(false)
      expect(titles(wrapper)).toEqual(['Receita de bolo'])
      expect(undoBar(wrapper).text()).toContain('Reunião de planejamento')
      expect(api.deleteNote).not.toHaveBeenCalled()
    })
  })

  // ---------- Abrir, criar, salvar

  it('clicking a card opens it in the editor (there is no read-only screen)', async () => {
    const wrapper = await mountDashboard()

    await wrapper.findAll('.note-card')[0]!.trigger('click')

    expect(form(wrapper).props('isOpen')).toBe(true)
    expect(form(wrapper).props('note')).toMatchObject({ id: 2, title: 'Receita de bolo' })
  })

  it('a new note starts in the folder the user is filtering by', async () => {
    const wrapper = await mountDashboard()
    expect(form(wrapper).props('defaultFolder')).toBeNull()

    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    expect(form(wrapper).props('defaultFolder')).toBe('Trabalho')
    expect(form(wrapper).props('defaultTag')).toBeNull()

    shell(wrapper).vm.$emit('selectTag', 'importante')
    await flushPromises()

    expect(form(wrapper).props('defaultFolder')).toBeNull()
    expect(form(wrapper).props('defaultTag')).toBe('importante')
  })

  it('saving closes the form, refreshes the lists and tells the user', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9, title: 'Roteiro', folder: 'Viagens', tags: [], isPinned: false } as any)
    const wrapper = await mountDashboard()
    await wrapper.find('.btn-add').trigger('click')

    form(wrapper).vm.$emit('saved', { title: 'Roteiro', content: '', folder: 'Viagens', tags: [], isPinned: false })
    await flushPromises()

    expect(form(wrapper).props('isOpen')).toBe(false)
    expect(form(wrapper).props('saving')).toBe(false)
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Nota criada!' }))
  })

  it('tells the form it is saving while the API answers', async () => {
    let finish!: (note: any) => void
    vi.mocked(api.createNote).mockReturnValue(new Promise(resolve => (finish = resolve)))
    const wrapper = await mountDashboard()

    form(wrapper).vm.$emit('saved', { title: 'Nota', content: '', folder: null, tags: [], isPinned: false })
    await flushPromises()
    expect(form(wrapper).props('saving')).toBe(true)

    finish({ id: 9, title: 'Nota', folder: null, tags: [], isPinned: false })
    await flushPromises()
    expect(form(wrapper).props('saving')).toBe(false)
  })

  it('if saving fails the form stays open with what was typed, and the user is told', async () => {
    const { ApiError } = await import('@/services/http')
    vi.mocked(api.createNote).mockRejectedValue(new ApiError(400, 'Título é obrigatório'))
    const wrapper = await mountDashboard()
    await wrapper.find('.btn-add').trigger('click')

    form(wrapper).vm.$emit('saved', { title: 'x', content: '', folder: null, tags: [], isPinned: false })
    await flushPromises()

    expect(form(wrapper).props('isOpen')).toBe(true)
    expect(form(wrapper).props('saving')).toBe(false)
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Título é obrigatório' }))
  })

  it('a new note hidden by the active folder filter clears the filter so it can be seen', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9, title: 'Roteiro', folder: 'Viagens', tags: [], isPinned: false } as any)
    const wrapper = await mountDashboard()
    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    form(wrapper).vm.$emit('saved', { title: 'Roteiro', content: '', folder: 'Viagens', tags: [], isPinned: false })
    await flushPromises()

    expect(shell(wrapper).props('selectedFolder')).toBeNull()
    expect(api.getNotes).toHaveBeenLastCalledWith(undefined, undefined)
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Mostrando todas as notas') }))
  })

  it('a new note that matches the active filter leaves the filter alone', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9, title: 'Reunião 2', folder: 'Trabalho', tags: [], isPinned: false } as any)
    const wrapper = await mountDashboard()
    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    form(wrapper).vm.$emit('saved', { title: 'Reunião 2', content: '', folder: 'Trabalho', tags: [], isPinned: false })
    await flushPromises()

    expect(shell(wrapper).props('selectedFolder')).toBe('Trabalho')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ detail: undefined }))
  })

  it('a new note hidden by the search or by the Favoritas tab is revealed too', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9, title: 'Roteiro', folder: null, tags: [], isPinned: false } as any)
    const wrapper = await mountDashboard()
    shell(wrapper).vm.$emit('search', 'bolo')
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')

    form(wrapper).vm.$emit('saved', { title: 'Roteiro', content: '', folder: null, tags: [], isPinned: false })
    await flushPromises()

    expect(shell(wrapper).props('search')).toBe('')
    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('aria-selected')).toBe('true')
  })

  it('editing a note does not touch the filters', async () => {
    vi.mocked(api.updateNote).mockResolvedValue({} as any)
    const wrapper = await mountDashboard()
    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()
    await wrapper.findAll('.note-card')[0]!.trigger('click')

    form(wrapper).vm.$emit('saved', { title: 'Outro', content: '', folder: 'Viagens', tags: [], isPinned: false })
    await flushPromises()

    expect(api.updateNote).toHaveBeenCalledWith(expect.objectContaining({ id: 2, title: 'Outro' }))
    expect(shell(wrapper).props('selectedFolder')).toBe('Trabalho')
  })

  it('does not blank the list with a spinner after the first load', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.find('.loading').exists()).toBe(false)

    let release!: (value: any) => void
    vi.mocked(api.getNotes).mockReturnValue(new Promise(resolve => (release = resolve)))
    shell(wrapper).vm.$emit('selectFolder', 'Trabalho')
    await flushPromises()

    expect(wrapper.find('.loading').exists()).toBe(false)
    expect(titles(wrapper)).toHaveLength(2)

    release([notes[0]])
    await flushPromises()
    expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
  })

  // ---------- Favoritar

  it('the star changes at once and the API is called with the new value', async () => {
    let finish!: () => void
    vi.mocked(api.updateNote).mockReturnValue(new Promise<any>(resolve => (finish = () => resolve({}))))
    const wrapper = await mountDashboard()

    // 1ª nota da lista = "Receita de bolo" (favorita)
    await wrapper.find('.icon-action.star').trigger('click')

    expect(wrapper.find('.icon-action.star').attributes('aria-pressed')).toBe('false') // antes de a API responder
    expect(wrapper.findAll('[role="tab"]')[1]!.text()).toContain('0')
    expect(api.updateNote).toHaveBeenCalledWith(expect.objectContaining({ id: 2, isPinned: false }))

    finish()
    await flushPromises()
    expect(api.getNotes).toHaveBeenCalledTimes(1) // não recarrega a lista inteira
  })

  it('if the API refuses, the star goes back and the user is told', async () => {
    const { ApiError } = await import('@/services/http')
    vi.mocked(api.updateNote).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))
    const wrapper = await mountDashboard()

    await wrapper.find('.icon-action.star').trigger('click')
    await flushPromises()

    expect(wrapper.find('.icon-action.star').attributes('aria-pressed')).toBe('true')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
  })

  // ---------- Erros

  it('warns the user when loading fails (network)', async () => {
    const { ApiError } = await import('@/services/http')
    vi.mocked(api.getNotes).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))

    await mountDashboard()

    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Não foi possível conectar ao servidor.' }))
  })

  it('does not toast on 401 (the session handler already sends the user to the login)', async () => {
    const { ApiError } = await import('@/services/http')
    vi.mocked(api.getNotes).mockRejectedValue(new ApiError(401, 'Sessão expirada'))
    vi.mocked(api.getFolders).mockRejectedValue(new ApiError(401, 'Sessão expirada'))
    vi.mocked(api.getTags).mockRejectedValue(new ApiError(401, 'Sessão expirada'))

    await mountDashboard()

    expect(toastAdd).not.toHaveBeenCalled()
  })
})
