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
  { id: 2, title: 'Receita de bolo', content: 'Misture ovos e farinha', createdAt: '2026-10-19T10:00:00Z', tags: [], folder: null, isPinned: false }
]

// Topbar e Sidebar reais dependem de router/sessão; aqui só interessam os eventos e props que o Dashboard usa
const TopbarStub = defineComponent({
  name: 'Topbar',
  props: { search: { type: String, default: '' } },
  emits: ['search', 'createNote'],
  setup: (props, { emit }) => () =>
    h('div', { class: 'topbar-stub' }, [
      h('input', { class: 'stub-search', value: props.search, onInput: (e: Event) => emit('search', (e.target as HTMLInputElement).value) }),
      h('button', { class: 'stub-new', onClick: () => emit('createNote') })
    ])
})

const SidebarStub = defineComponent({
  name: 'Sidebar',
  props: ['folders', 'tags', 'selectedFolder', 'selectedTag'],
  emits: ['selectFolder', 'selectTag', 'clearFilters'],
  setup: (props, { emit }) => () =>
    h('div', { class: 'sidebar-stub' }, [
      h('button', { class: 'stub-folder', onClick: () => emit('selectFolder', 'Trabalho') }),
      h('button', { class: 'stub-clear', onClick: () => emit('clearFilters') })
    ])
})

const FormStub = defineComponent({
  name: 'NoteFormModal',
  props: ['isOpen', 'note', 'folders'],
  emits: ['close', 'saved'],
  setup: () => () => h('div', { class: 'form-stub' })
})

const mountDashboard = async () => {
  const wrapper = mount(DashboardView, {
    global: { stubs: { Topbar: TopbarStub, Sidebar: SidebarStub, NoteFormModal: FormStub } }
  })
  await flushPromises()
  return wrapper
}

const titles = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.note-title').map(t => t.text())

describe('DashboardView', () => {
  beforeEach(() => {
    vi.mocked(api.getNotes).mockReset().mockResolvedValue(notes as any)
    vi.mocked(api.getFolders).mockReset().mockResolvedValue(['Trabalho', 'Pessoal'])
    vi.mocked(api.getTags).mockReset().mockResolvedValue(['importante'])
    toastAdd.mockClear()
  })

  it('shows the notes under a single h1', async () => {
    const wrapper = await mountDashboard()

    expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Receita de bolo'])
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('Minhas Notas')
  })

  it('offers a skip link to the main content', async () => {
    const wrapper = await mountDashboard()

    expect(wrapper.find('a.skip-link').attributes('href')).toBe('#conteudo')
    expect(wrapper.find('main#conteudo').exists()).toBe(true)
  })

  it('passes the real folders to the form', async () => {
    const wrapper = await mountDashboard()

    expect(wrapper.findComponent(FormStub).props('folders')).toEqual(['Trabalho', 'Pessoal'])
  })

  it('search filters without losing notes: deleting letters brings them back', async () => {
    const wrapper = await mountDashboard()

    await wrapper.find('.stub-search').setValue('bolo')
    expect(titles(wrapper)).toEqual(['Receita de bolo'])

    await wrapper.find('.stub-search').setValue('bo')
    expect(titles(wrapper)).toEqual(['Receita de bolo'])

    // "b" também aparece em "Trabalho": a nota que tinha sumido da tela volta
    await wrapper.find('.stub-search').setValue('b')
    expect(titles(wrapper)).toHaveLength(2)

    await wrapper.find('.stub-search').setValue('')
    expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Receita de bolo'])
    expect(api.getNotes).toHaveBeenCalledTimes(1) // não precisa ir ao servidor
  })

  it('search ignores accents and case', async () => {
    const wrapper = await mountDashboard()

    await wrapper.find('.stub-search').setValue('REUNIAO')

    expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
  })

  it('a search with no match says so and lets the user clear it', async () => {
    const wrapper = await mountDashboard()

    await wrapper.find('.stub-search').setValue('zzz')

    expect(wrapper.find('.empty-state').text()).toContain('Nenhum resultado')
    expect(wrapper.find('.empty-state').text()).toContain('zzz')
    expect(wrapper.find('.empty-state').text()).not.toContain('Nenhuma nota ainda')

    await wrapper.find('.empty-action').trigger('click')

    expect(titles(wrapper)).toHaveLength(2)
    expect(wrapper.findComponent(TopbarStub).props('search')).toBe('')
  })

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

    await wrapper.find('.stub-folder').trigger('click')
    await flushPromises()

    expect(api.getNotes).toHaveBeenLastCalledWith('Trabalho', undefined)
    expect(wrapper.find('.empty-state').text()).toContain('Nada em Pasta: Trabalho')

    vi.mocked(api.getNotes).mockResolvedValue(notes as any)
    await wrapper.find('.empty-action').trigger('click')
    await flushPromises()

    expect(titles(wrapper)).toHaveLength(2)
  })

  it('the active filter chip can be removed with an accessible button', async () => {
    const wrapper = await mountDashboard()
    await wrapper.find('.stub-folder').trigger('click')
    await flushPromises()

    const remove = wrapper.find('.clear-filter')

    expect(remove.attributes('aria-label')).toBe('Remover filtro')
  })

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

  it('a note saved in a brand-new folder makes the folder show up in the sidebar', async () => {
    vi.mocked(api.createNote).mockResolvedValue({ id: 9 } as any)
    const wrapper = await mountDashboard()
    expect(wrapper.findComponent(FormStub).props('folders')).toEqual(['Trabalho', 'Pessoal'])

    vi.mocked(api.getFolders).mockResolvedValue(['Trabalho', 'Pessoal', 'Viagens'])
    wrapper.findComponent(FormStub).vm.$emit('saved', {
      title: 'Roteiro', content: 'Passagens e hotel para a viagem', folder: 'Viagens', tags: [], isPinned: false
    })
    await flushPromises()

    expect(api.createNote).toHaveBeenCalledTimes(1)
    expect(api.getFolders).toHaveBeenCalledTimes(2) // carga inicial + depois de salvar
    expect(wrapper.findComponent(FormStub).props('folders')).toContain('Viagens')
  })

  it('deleting a note refreshes folders and tags too', async () => {
    vi.stubGlobal('confirm', () => true)
    vi.mocked(api.deleteNote).mockResolvedValue(undefined)
    const wrapper = await mountDashboard()

    await wrapper.find('.action-btn.delete').trigger('click')
    await flushPromises()

    expect(api.deleteNote).toHaveBeenCalledTimes(1)
    expect(api.getFolders).toHaveBeenCalledTimes(2)
    expect(api.getTags).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})
