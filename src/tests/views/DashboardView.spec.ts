import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  props: ['isOpen', 'note', 'folders'],
  emits: ['close', 'saved'],
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

describe('DashboardView', () => {
  beforeEach(() => {
    vi.mocked(api.getNotes).mockReset().mockResolvedValue(notes as any)
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

  it('passes the real folders to the form', async () => {
    const wrapper = await mountDashboard()

    expect(wrapper.findComponent(FormStub).props('folders')).toEqual(['Trabalho', 'Pessoal'])
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
    vi.mocked(api.getNotes).mockResolvedValue([notes[0]] as any)
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

    vi.mocked(api.getNotes).mockResolvedValue(notes as any)
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
    wrapper.findComponent(FormStub).vm.$emit('saved', {
      title: 'Roteiro', content: 'Passagens e hotel para a viagem', folder: 'Viagens', tags: [], isPinned: false
    })
    await flushPromises()

    expect(api.createNote).toHaveBeenCalledTimes(1)
    expect(api.getFolders).toHaveBeenCalledTimes(2) // carga inicial + depois de salvar
    expect(shell(wrapper).props('folders')).toContain('Viagens')
  })

  it('deleting a note refreshes folders and tags too', async () => {
    vi.stubGlobal('confirm', () => true)
    vi.mocked(api.deleteNote).mockResolvedValue(undefined)
    const wrapper = await mountDashboard()

    await wrapper.find('.icon-action.delete').trigger('click')
    await flushPromises()

    expect(api.deleteNote).toHaveBeenCalledTimes(1)
    expect(api.getFolders).toHaveBeenCalledTimes(2)
    expect(api.getTags).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('does not delete when the user cancels the confirmation', async () => {
    vi.stubGlobal('confirm', () => false)
    const wrapper = await mountDashboard()

    await wrapper.find('.icon-action.delete').trigger('click')
    await flushPromises()

    expect(api.deleteNote).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('the star toggles the favorite state through the API', async () => {
    vi.mocked(api.updateNote).mockResolvedValue({} as any)
    const wrapper = await mountDashboard()

    // 1ª nota da lista = "Receita de bolo" (favorita)
    await wrapper.find('.icon-action.star').trigger('click')
    await flushPromises()

    expect(api.updateNote).toHaveBeenCalledWith(expect.objectContaining({ id: 2, isPinned: false }))
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
