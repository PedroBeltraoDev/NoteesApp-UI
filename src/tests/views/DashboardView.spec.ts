import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { api } from '@/services/api'
import { ApiError } from '@/services/http'

vi.mock('@/services/api', () => ({
  api: {
    getNotes: vi.fn(),
    getFolders: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    deleteFolder: vi.fn()
  }
}))

const toastAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))

const notes = [
  { id: 1, title: 'Reunião de planejamento', content: 'Revisar metas do trimestre', createdAt: '2026-10-20T10:00:00Z', updatedAt: null, tags: ['importante'], folderId: 1, folder: 'Trabalho', isPinned: false },
  { id: 2, title: 'Receita de bolo', content: 'Misture ovos e farinha', createdAt: '2026-10-19T10:00:00Z', updatedAt: null, tags: [], folderId: null, folder: null, isPinned: true },
  { id: 3, title: 'Relatório mensal', content: 'Fechar os números do mês', createdAt: '2026-10-18T10:00:00Z', updatedAt: '2026-10-25T10:00:00Z', tags: ['Importante', 'finanças'], folderId: 1, folder: 'Trabalho', isPinned: false }
]

// "Pessoal" é uma pasta vazia: pastas existem por conta própria, mesmo sem notas
const folders = [
  { id: 1, name: 'Trabalho', noteCount: 2, createdAt: '2026-10-01T10:00:00Z' },
  { id: 2, name: 'Pessoal', noteCount: 0, createdAt: '2026-10-02T10:00:00Z' }
]

// A tela muda as notas na hora (estrela), então cada teste recebe cópias novas para um não contaminar o outro
const freshNotes = () => notes.map(n => ({ ...n, tags: [...n.tags] }))
const freshFolders = () => folders.map(f => ({ ...f }))

// O shell (barra lateral, cabeçalho, sessão) é testado à parte; aqui interessam as props que o Dashboard passa para
// ele, o evento de busca e o conteúdo do painel (slot)
const AppShellStub = defineComponent({
  name: 'AppShell',
  props: ['title', 'search', 'showSearch'],
  emits: ['search'],
  setup: (_, { slots }) => () => h('div', { class: 'shell-stub' }, slots.default?.())
})

const FormStub = defineComponent({
  name: 'NoteFormModal',
  props: ['isOpen', 'note', 'folders', 'tags', 'defaultFolderId', 'defaultTag', 'saving'],
  emits: ['close', 'saved', 'delete'],
  setup: () => () => h('div', { class: 'form-stub' })
})

const FolderDialogStub = defineComponent({
  name: 'FolderNameDialog',
  props: ['isOpen', 'folder', 'error', 'saving'],
  emits: ['close', 'save'],
  setup: () => () => h('div', { class: 'folder-dialog-stub' })
})

const ConfirmStub = defineComponent({
  name: 'ConfirmDialog',
  props: ['isOpen', 'title', 'message', 'confirmLabel', 'busy'],
  emits: ['confirm', 'cancel'],
  setup: () => () => h('div', { class: 'confirm-stub' })
})

type Wrapper = ReturnType<typeof mount>

const mountDashboard = async (path = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }]
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(DashboardView, {
    global: {
      plugins: [router],
      stubs: { AppShell: AppShellStub, NoteFormModal: FormStub, FolderNameDialog: FolderDialogStub, ConfirmDialog: ConfirmStub }
    }
  })
  await flushPromises()
  return { wrapper, router }
}

const shell = (wrapper: Wrapper) => wrapper.findComponent(AppShellStub)
const form = (wrapper: Wrapper) => wrapper.findComponent(FormStub)
const folderDialog = (wrapper: Wrapper) => wrapper.findComponent(FolderDialogStub)
const confirm = (wrapper: Wrapper) => wrapper.findComponent(ConfirmStub)

const titles = (wrapper: Wrapper) => wrapper.findAll('.note-title').map(t => t.text())
const tabs = (wrapper: Wrapper) => wrapper.findAll('[role="tab"]')
const tileNames = (wrapper: Wrapper) => wrapper.findAll('.tile .tile-name').map(t => t.text())
const tile = (wrapper: Wrapper, name: string) => wrapper.findAll('.tile').find(t => t.find('.tile-name').text() === name)!
const query = (router: ReturnType<typeof createRouter>) => router.currentRoute.value.query
const undoBar = (wrapper: Wrapper) => wrapper.find('.undo-bar')

// Exclui pelo menu ⋮ do cartão na posição `index` da lista
const deleteFromMenu = async (wrapper: Wrapper, index = 0) => {
  const card = wrapper.findAll('.note-card')[index]!
  await card.find('.kebab-trigger').trigger('click')
  await card.findAll('[role="menuitem"]').find(i => i.text() === 'Excluir')!.trigger('click')
  await flushPromises()
}

// Ação do menu ⋮ de uma pasta (Renomear / Excluir pasta)
const folderMenuAction = async (wrapper: Wrapper, folderName: string, action: string) => {
  const t = tile(wrapper, folderName)
  await t.find('.kebab-trigger').trigger('click')
  await t.findAll('[role="menuitem"]').find(i => i.text() === action)!.trigger('click')
  await flushPromises()
}

describe('DashboardView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(api.getNotes).mockReset().mockImplementation(async () => freshNotes() as any)
    vi.mocked(api.getFolders).mockReset().mockImplementation(async () => freshFolders() as any)
    vi.mocked(api.createNote).mockReset()
    vi.mocked(api.updateNote).mockReset()
    vi.mocked(api.deleteNote).mockReset()
    vi.mocked(api.createFolder).mockReset()
    vi.mocked(api.renameFolder).mockReset()
    vi.mocked(api.deleteFolder).mockReset()
    toastAdd.mockClear()
  })

  // ---------- Todas as notas

  describe('all notes', () => {
    it('shows the notes inside the shell, titled "Notas", newest first', async () => {
      const { wrapper } = await mountDashboard()

      expect(shell(wrapper).props('title')).toBe('Notas')
      expect(shell(wrapper).props('showSearch')).toBe(true)
      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Receita de bolo', 'Relatório mensal'])
    })

    it('loads everything once: notes and folders (tags come from the notes)', async () => {
      await mountDashboard()

      expect(api.getNotes).toHaveBeenCalledTimes(1)
      expect(api.getNotes).toHaveBeenCalledWith()
      expect(api.getFolders).toHaveBeenCalledTimes(1)
    })

    it('has the Todas | Pastas | Tags tabs with counts', async () => {
      const { wrapper } = await mountDashboard()

      // O nome completo ("Todas as notas") fica para leitores de tela mesmo quando o celular esconde " as notas"
      expect(tabs(wrapper).map(t => t.find('span').text())).toEqual(['Todas as notas', 'Pastas', 'Tags'])
      expect(tabs(wrapper).map(t => t.find('.tab-count').text())).toEqual(['3', '2', '2'])
      expect(tabs(wrapper)[0]!.find('.sr-only').text()).toBe('(3)')
      expect(tabs(wrapper).map(t => t.attributes('aria-selected'))).toEqual(['true', 'false', 'false'])
    })

    it('passes the real folders and the tags in use to the form', async () => {
      const { wrapper } = await mountDashboard()

      expect(form(wrapper).props('folders')).toEqual(folders)
      expect(form(wrapper).props('tags')).toEqual(['finanças', 'importante'])
    })

    it('the "Nova nota" button opens an empty form with no folder or tag preselected', async () => {
      const { wrapper } = await mountDashboard()

      await wrapper.find('.btn-add').trigger('click')

      expect(form(wrapper).props('isOpen')).toBe(true)
      expect(form(wrapper).props('note')).toBeNull()
      expect(form(wrapper).props('defaultFolderId')).toBeNull()
      expect(form(wrapper).props('defaultTag')).toBeNull()
    })

    it('clicking a card opens it in the editor (there is no read-only screen)', async () => {
      const { wrapper } = await mountDashboard()

      await wrapper.findAll('.note-card')[0]!.trigger('click')

      expect(form(wrapper).props('isOpen')).toBe(true)
      expect(form(wrapper).props('note')).toMatchObject({ id: 1, title: 'Reunião de planejamento' })
    })

    it('an account without notes gets a call to action', async () => {
      vi.mocked(api.getNotes).mockResolvedValue([])
      const { wrapper } = await mountDashboard()

      expect(wrapper.find('.empty-state').text()).toContain('Nenhuma nota ainda')
      await wrapper.find('.empty-action').trigger('click')

      expect(form(wrapper).props('isOpen')).toBe(true)
    })
  })

  // ---------- Abas e URL

  describe('tabs and URL', () => {
    it('picking a tab changes the view and the URL', async () => {
      const { wrapper, router } = await mountDashboard()

      await tabs(wrapper)[1]!.trigger('click')
      await flushPromises()
      expect(query(router)).toEqual({ view: 'folders' })
      expect(tabs(wrapper)[1]!.attributes('aria-selected')).toBe('true')

      await tabs(wrapper)[0]!.trigger('click')
      await flushPromises()
      expect(query(router)).toEqual({})
    })

    it('opens on the view written in the URL (links and reloads work)', async () => {
      const { wrapper } = await mountDashboard('/?view=tags')

      expect(tabs(wrapper)[2]!.attributes('aria-selected')).toBe('true')
      expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe('tab-tags')
    })

    it('an unknown view in the URL falls back to all notes', async () => {
      const { wrapper } = await mountDashboard('/?view=qualquer-coisa')

      expect(tabs(wrapper)[0]!.attributes('aria-selected')).toBe('true')
      expect(titles(wrapper)).toHaveLength(3)
    })

    it('arrow keys move between the tabs and the view follows', async () => {
      const { wrapper, router } = await mountDashboard()

      await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
      await flushPromises()
      expect(query(router)).toEqual({ view: 'folders' })

      await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'End' })
      await flushPromises()
      expect(query(router)).toEqual({ view: 'tags' })

      await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
      await flushPromises()
      expect(query(router)).toEqual({}) // volta ao começo
    })

    it('only the selected tab is in the tab order (roving tabindex)', async () => {
      const { wrapper } = await mountDashboard()

      expect(tabs(wrapper).map(t => t.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    })

    it('the browser Back button goes back to where you were', async () => {
      const { wrapper, router } = await mountDashboard('/?view=folders')
      await tile(wrapper, 'Trabalho').find('.tile-open').trigger('click')
      await flushPromises()
      expect(query(router)).toEqual({ view: 'folders', folder: '1' })

      router.back()
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders' })
      expect(tileNames(wrapper)).toContain('Trabalho')
    })
  })

  // ---------- Ordem por data

  describe('order by date', () => {
    const select = (wrapper: Wrapper) => wrapper.find('select.sort-select')

    it('offers newest, oldest and last edited, newest by default', async () => {
      const { wrapper } = await mountDashboard()

      expect(select(wrapper).findAll('option').map(o => o.text())).toEqual(['Mais recentes', 'Mais antigas', 'Editadas por último'])
      expect((select(wrapper).element as HTMLSelectElement).value).toBe('newest')
      expect(select(wrapper).attributes('aria-label')).toBe('Ordenar as notas por data')
    })

    it('"Mais antigas" reverses the list', async () => {
      const { wrapper } = await mountDashboard()

      await select(wrapper).setValue('oldest')

      expect(titles(wrapper)).toEqual(['Relatório mensal', 'Receita de bolo', 'Reunião de planejamento'])
    })

    it('"Editadas por último" puts the most recently edited first', async () => {
      const { wrapper } = await mountDashboard()

      await select(wrapper).setValue('edited')

      // Relatório foi editado em 25/10; as outras nunca foram editadas e valem pela criação
      expect(titles(wrapper)).toEqual(['Relatório mensal', 'Reunião de planejamento', 'Receita de bolo'])
    })

    it('favorites no longer jump to the top: the order is strictly by date', async () => {
      const { wrapper } = await mountDashboard()

      // "Receita de bolo" é favorita, mas é a 2ª por data
      expect(titles(wrapper)[0]).toBe('Reunião de planejamento')
    })

    it('remembers the choice for the next visit', async () => {
      const first = await mountDashboard()
      await select(first.wrapper).setValue('oldest')
      first.wrapper.unmount()

      const { wrapper } = await mountDashboard()

      expect((select(wrapper).element as HTMLSelectElement).value).toBe('oldest')
      expect(titles(wrapper)[0]).toBe('Relatório mensal')
    })

    it('ignores a saved order it does not know', async () => {
      localStorage.setItem('noteesapp-sort', 'alfabetica')

      const { wrapper } = await mountDashboard()

      expect((select(wrapper).element as HTMLSelectElement).value).toBe('newest')
    })

    it('applies inside a folder too', async () => {
      const { wrapper } = await mountDashboard('/?view=folders&folder=1')
      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Relatório mensal'])

      await select(wrapper).setValue('oldest')

      expect(titles(wrapper)).toEqual(['Relatório mensal', 'Reunião de planejamento'])
    })

    it('is hidden on the folder and tag grids (they list folders and tags, not notes)', async () => {
      const inFolders = await mountDashboard('/?view=folders')
      const inTags = await mountDashboard('/?view=tags')

      expect(select(inFolders.wrapper).exists()).toBe(false)
      expect(select(inTags.wrapper).exists()).toBe(false)
    })
  })

  // ---------- Favoritas

  describe('favorites', () => {
    const toggle = (wrapper: Wrapper) => wrapper.find('button.toggle')

    it('the Favoritas button shows only the favorite notes', async () => {
      const { wrapper } = await mountDashboard()
      expect(toggle(wrapper).attributes('aria-pressed')).toBe('false')

      await toggle(wrapper).trigger('click')

      expect(toggle(wrapper).attributes('aria-pressed')).toBe('true')
      expect(titles(wrapper)).toEqual(['Receita de bolo'])
    })

    it('an empty selection explains how to favorite and lets you show everything again', async () => {
      const { wrapper } = await mountDashboard('/?view=folders&folder=1')
      await toggle(wrapper).trigger('click')

      expect(wrapper.find('.empty-state').text()).toContain('Nenhuma favorita aqui')

      await wrapper.find('.empty-action').trigger('click')

      expect(titles(wrapper)).toHaveLength(2)
    })

    it('is hidden on the folder and tag grids', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')

      expect(toggle(wrapper).exists()).toBe(false)
    })

    it('the star changes at once and the API is called with the new value', async () => {
      let finish!: () => void
      vi.mocked(api.updateNote).mockReturnValue(new Promise<any>(resolve => (finish = () => resolve({}))))
      const { wrapper } = await mountDashboard()
      const star = () => wrapper.findAll('.note-card')[1]!.find('.icon-action.star') // "Receita de bolo" (favorita)
      expect(star().attributes('aria-pressed')).toBe('true')

      await star().trigger('click')

      expect(star().attributes('aria-pressed')).toBe('false') // antes de a API responder
      expect(api.updateNote).toHaveBeenCalledWith(expect.objectContaining({ id: 2, isPinned: false }))

      finish()
      await flushPromises()
      expect(api.getNotes).toHaveBeenCalledTimes(1) // não recarrega a lista inteira
    })

    it('if the API refuses, the star goes back and the user is told', async () => {
      vi.mocked(api.updateNote).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))
      const { wrapper } = await mountDashboard()

      await wrapper.findAll('.note-card')[1]!.find('.icon-action.star').trigger('click')
      await flushPromises()

      expect(wrapper.findAll('.note-card')[1]!.find('.icon-action.star').attributes('aria-pressed')).toBe('true')
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
    })
  })

  // ---------- Pastas

  describe('folders', () => {
    it('lists the folders as tiles with their note counts, including empty ones and the notes without folder', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')

      expect(tileNames(wrapper)).toEqual(['Sem pasta', 'Trabalho', 'Pessoal'])
      expect(wrapper.findAll('.tile .tile-count').map(c => c.text())).toEqual(['1 nota', '2 notas', '0 notas'])
      expect(wrapper.find('.tile-add').text()).toContain('Nova pasta')
      expect(wrapper.find('.note-card').exists()).toBe(false)
    })

    it('hides the "Sem pasta" tile when every note is in a folder', async () => {
      vi.mocked(api.getNotes).mockImplementation(async () => freshNotes().filter(n => n.folderId !== null) as any)

      const { wrapper } = await mountDashboard('/?view=folders')

      expect(tileNames(wrapper)).toEqual(['Trabalho', 'Pessoal'])
    })

    it('with no folders yet it explains what they are and offers to create one', async () => {
      vi.mocked(api.getFolders).mockResolvedValue([])
      vi.mocked(api.getNotes).mockResolvedValue([])

      const { wrapper } = await mountDashboard('/?view=folders')

      expect(wrapper.find('.hint').text()).toContain('Pastas agrupam')
      expect(wrapper.find('.tile-add').exists()).toBe(true)
    })

    it('entering a folder shows only its notes, with a breadcrumb back to all folders', async () => {
      const { wrapper, router } = await mountDashboard('/?view=folders')

      await tile(wrapper, 'Trabalho').find('.tile-open').trigger('click')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders', folder: '1' })
      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Relatório mensal'])
      expect(wrapper.find('.breadcrumb').attributes('aria-label')).toBe('Você está em')
      expect(wrapper.findAll('.breadcrumb li').map(li => li.text())).toEqual(['Pastas', 'Trabalho'])
      expect(wrapper.find('.crumb-current').attributes('aria-current')).toBe('page')

      await wrapper.find('.crumb-link').trigger('click')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders' })
      expect(tileNames(wrapper)).toContain('Trabalho')
    })

    it('"Sem pasta" opens the notes that are in no folder, and offers no rename or delete', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')

      await tile(wrapper, 'Sem pasta').find('.tile-open').trigger('click')
      await flushPromises()

      expect(titles(wrapper)).toEqual(['Receita de bolo'])
      expect(wrapper.find('.crumb-current').text()).toBe('Sem pasta')
      expect(wrapper.find('.scope-actions').exists()).toBe(false)
    })

    it('an empty folder says so and offers to create a note right there', async () => {
      const { wrapper } = await mountDashboard('/?view=folders&folder=2')

      expect(wrapper.find('.empty-state').text()).toContain('Esta pasta está vazia')

      await wrapper.find('.empty-action.primary').trigger('click')

      expect(form(wrapper).props('isOpen')).toBe(true)
      expect(form(wrapper).props('defaultFolderId')).toBe(2)
    })

    it('a folder that does not exist (deleted, or an old link) says so and goes back to the folders', async () => {
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=999')

      expect(wrapper.find('.empty-state').text()).toContain('Pasta não encontrada')

      await wrapper.find('.empty-action').trigger('click')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders' })
    })

    it('a new note created inside a folder starts in that folder', async () => {
      const { wrapper } = await mountDashboard('/?view=folders&folder=1')

      await wrapper.find('.btn-add').trigger('click')

      expect(form(wrapper).props('defaultFolderId')).toBe(1)
    })

    it('the folder color is the same on the tile and on its notes', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')
      const tileColor = tile(wrapper, 'Trabalho').attributes('style')

      await tile(wrapper, 'Trabalho').find('.tile-open').trigger('click')
      await flushPromises()

      const cardColor = wrapper.find('.note-card').attributes('style')
      expect(tileColor).toContain('--tile-color')
      expect(cardColor!.split(': ')[1]).toBe(tileColor!.split(': ')[1])
    })

    // ----- criar

    it('"Nova pasta" opens the name dialog; saving creates it and refreshes the list', async () => {
      vi.mocked(api.createFolder).mockResolvedValue({ id: 3, name: 'Ideias', noteCount: 0 } as any)
      const { wrapper } = await mountDashboard('/?view=folders')
      expect(folderDialog(wrapper).props('isOpen')).toBe(false)

      await wrapper.find('.tile-add').trigger('click')
      expect(folderDialog(wrapper).props('isOpen')).toBe(true)
      expect(folderDialog(wrapper).props('folder')).toBeNull()

      vi.mocked(api.getFolders).mockResolvedValue([...freshFolders(), { id: 3, name: 'Ideias', noteCount: 0, createdAt: '' }] as any)
      folderDialog(wrapper).vm.$emit('save', 'Ideias')
      await flushPromises()

      expect(api.createFolder).toHaveBeenCalledExactlyOnceWith('Ideias')
      expect(folderDialog(wrapper).props('isOpen')).toBe(false)
      expect(tileNames(wrapper)).toContain('Ideias')
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Pasta criada!' }))
    })

    it('a repeated name keeps the dialog open and shows the error on its field', async () => {
      vi.mocked(api.createFolder).mockRejectedValue(new ApiError(409, 'Já existe uma pasta com esse nome'))
      const { wrapper } = await mountDashboard('/?view=folders')
      await wrapper.find('.tile-add').trigger('click')

      folderDialog(wrapper).vm.$emit('save', 'Trabalho')
      await flushPromises()

      expect(folderDialog(wrapper).props('isOpen')).toBe(true)
      expect(folderDialog(wrapper).props('error')).toBe('Já existe uma pasta com esse nome')
      expect(folderDialog(wrapper).props('saving')).toBe(false)
      expect(toastAdd).not.toHaveBeenCalled()
    })

    it('another failure (network) is a toast and the dialog stays open', async () => {
      vi.mocked(api.createFolder).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))
      const { wrapper } = await mountDashboard('/?view=folders')
      await wrapper.find('.tile-add').trigger('click')

      folderDialog(wrapper).vm.$emit('save', 'Ideias')
      await flushPromises()

      expect(folderDialog(wrapper).props('isOpen')).toBe(true)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Não foi possível conectar ao servidor.' }))
    })

    // ----- renomear

    it('renaming from the tile menu opens the dialog with that folder and saves by id', async () => {
      vi.mocked(api.renameFolder).mockResolvedValue({ id: 1, name: 'Escritório', noteCount: 2 } as any)
      const { wrapper } = await mountDashboard('/?view=folders')

      await folderMenuAction(wrapper, 'Trabalho', 'Renomear')
      expect(folderDialog(wrapper).props('isOpen')).toBe(true)
      expect(folderDialog(wrapper).props('folder')).toMatchObject({ id: 1, name: 'Trabalho' })

      folderDialog(wrapper).vm.$emit('save', 'Escritório')
      await flushPromises()

      expect(api.renameFolder).toHaveBeenCalledExactlyOnceWith(1, 'Escritório')
      expect(folderDialog(wrapper).props('isOpen')).toBe(false)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Pasta renomeada!' }))
    })

    it('inside a folder, "Renomear" in the header does the same and keeps you in the folder', async () => {
      vi.mocked(api.renameFolder).mockResolvedValue({ id: 1, name: 'Escritório', noteCount: 2 } as any)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=1')

      await wrapper.findAll('.scope-actions .link-btn')[0]!.trigger('click')
      expect(folderDialog(wrapper).props('folder')).toMatchObject({ id: 1 })

      vi.mocked(api.getFolders).mockResolvedValue([{ ...folders[0], name: 'Escritório' }, folders[1]] as any)
      folderDialog(wrapper).vm.$emit('save', 'Escritório')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders', folder: '1' }) // o id não muda, então a URL continua valendo
      expect(wrapper.find('.crumb-current').text()).toBe('Escritório')
    })

    // ----- excluir

    it('deleting asks first, telling how many notes are inside and that none is deleted', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')

      await folderMenuAction(wrapper, 'Trabalho', 'Excluir pasta')

      expect(confirm(wrapper).props('isOpen')).toBe(true)
      expect(confirm(wrapper).props('title')).toBe('Excluir pasta?')
      expect(confirm(wrapper).props('message')).toContain('“Trabalho”')
      expect(confirm(wrapper).props('message')).toContain('As 2 notas dentro dela não serão apagadas')
      expect(confirm(wrapper).props('message')).toContain('Sem pasta')
      expect(api.deleteFolder).not.toHaveBeenCalled()
    })

    it('the message fits an empty folder', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')

      await folderMenuAction(wrapper, 'Pessoal', 'Excluir pasta')

      expect(confirm(wrapper).props('message')).toBe('Excluir a pasta “Pessoal”? Ela está vazia.')
    })

    it('the message fits a folder with a single note', async () => {
      vi.mocked(api.getNotes).mockImplementation(async () => freshNotes().filter(n => n.id !== 3) as any)
      const { wrapper } = await mountDashboard('/?view=folders')

      await folderMenuAction(wrapper, 'Trabalho', 'Excluir pasta')

      expect(confirm(wrapper).props('message')).toBe('Excluir a pasta “Trabalho”? A nota dentro dela não será apagada: fica em “Sem pasta”.')
    })

    it('cancelling deletes nothing', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')
      await folderMenuAction(wrapper, 'Trabalho', 'Excluir pasta')

      confirm(wrapper).vm.$emit('cancel')
      await flushPromises()

      expect(confirm(wrapper).props('isOpen')).toBe(false)
      expect(api.deleteFolder).not.toHaveBeenCalled()
    })

    it('confirming deletes the folder, reloads notes (they lose their folder) and tells the user', async () => {
      vi.mocked(api.deleteFolder).mockResolvedValue(undefined)
      const { wrapper } = await mountDashboard('/?view=folders')
      await folderMenuAction(wrapper, 'Trabalho', 'Excluir pasta')

      // O servidor já devolve as notas sem pasta e a lista sem a pasta excluída
      vi.mocked(api.getNotes).mockImplementation(async () => freshNotes().map(n => ({ ...n, folderId: null, folder: null })) as any)
      vi.mocked(api.getFolders).mockResolvedValue([folders[1]] as any)
      confirm(wrapper).vm.$emit('confirm')
      await flushPromises()

      expect(api.deleteFolder).toHaveBeenCalledExactlyOnceWith(1)
      expect(api.getNotes).toHaveBeenCalledTimes(2)
      expect(tileNames(wrapper)).toEqual(['Sem pasta', 'Pessoal'])
      expect(wrapper.findAll('.tile .tile-count')[0]!.text()).toBe('3 notas')
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Pasta excluída', detail: 'As 2 notas estão em “Sem pasta”.' }))
    })

    it('deleting the folder you are inside takes you back to the folder list', async () => {
      vi.mocked(api.deleteFolder).mockResolvedValue(undefined)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=1')

      await wrapper.find('.scope-actions .link-btn.danger').trigger('click')
      expect(confirm(wrapper).props('isOpen')).toBe(true)

      vi.mocked(api.getFolders).mockResolvedValue([folders[1]] as any)
      confirm(wrapper).vm.$emit('confirm')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders' })
    })

    it('if the server refuses, the user is told and the folder stays', async () => {
      vi.mocked(api.deleteFolder).mockRejectedValue(new ApiError(500, 'Falha no servidor'))
      const { wrapper } = await mountDashboard('/?view=folders')
      await folderMenuAction(wrapper, 'Trabalho', 'Excluir pasta')

      confirm(wrapper).vm.$emit('confirm')
      await flushPromises()

      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Falha no servidor' }))
      expect(tileNames(wrapper)).toContain('Trabalho')
      expect(confirm(wrapper).props('busy')).toBe(false)
    })
  })

  // ---------- Tags

  describe('tags', () => {
    it('lists the tags in use as tiles with counts, joining spellings that differ by case', async () => {
      const { wrapper } = await mountDashboard('/?view=tags')

      expect(tileNames(wrapper)).toEqual(['finanças', 'importante'])
      expect(wrapper.findAll('.tile .tile-count').map(c => c.text())).toEqual(['1 nota', '2 notas'])
    })

    it('tag tiles have no ⋮ menu: tags live on the notes, there is nothing to rename or delete here', async () => {
      const { wrapper } = await mountDashboard('/?view=tags')

      expect(wrapper.find('.tile .kebab-trigger').exists()).toBe(false)
    })

    it('opening a tag shows the notes that use it (any case), with a breadcrumb', async () => {
      const { wrapper, router } = await mountDashboard('/?view=tags')

      await tile(wrapper, 'importante').find('.tile-open').trigger('click')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'tags', tag: 'importante' })
      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Relatório mensal'])
      expect(wrapper.findAll('.breadcrumb li').map(li => li.text())).toEqual(['Tags', 'importante'])
    })

    it('a new note created inside a tag starts with that tag', async () => {
      const { wrapper } = await mountDashboard('/?view=tags&tag=importante')

      await wrapper.find('.btn-add').trigger('click')

      expect(form(wrapper).props('defaultTag')).toBe('importante')
      expect(form(wrapper).props('defaultFolderId')).toBeNull()
    })

    it('without tags it explains how to get some', async () => {
      vi.mocked(api.getNotes).mockImplementation(async () => freshNotes().map(n => ({ ...n, tags: [] })) as any)

      const { wrapper } = await mountDashboard('/?view=tags')

      expect(wrapper.find('.empty-state').text()).toContain('Nenhuma tag ainda')
    })

    it('a tag no note uses says so and goes back to the tags', async () => {
      const { wrapper, router } = await mountDashboard('/?view=tags&tag=fantasma')

      expect(wrapper.find('.empty-state').text()).toContain('Nenhuma nota com essa tag')

      await wrapper.find('.empty-action').trigger('click')
      await flushPromises()

      expect(query(router)).toEqual({ view: 'tags' })
    })
  })

  // ---------- Busca

  describe('search', () => {
    it('filters without losing notes: deleting letters brings them back', async () => {
      const { wrapper } = await mountDashboard()

      shell(wrapper).vm.$emit('search', 'bolo')
      await flushPromises()
      expect(titles(wrapper)).toEqual(['Receita de bolo'])

      shell(wrapper).vm.$emit('search', 'b')
      await flushPromises()
      expect(titles(wrapper)).toHaveLength(3) // "b" aparece em "Trabalho" e "Receita de bolo"...

      shell(wrapper).vm.$emit('search', '')
      await flushPromises()
      expect(titles(wrapper)).toHaveLength(3)
      expect(api.getNotes).toHaveBeenCalledTimes(1) // não precisa ir ao servidor
    })

    it('ignores accents and case', async () => {
      const { wrapper } = await mountDashboard()

      shell(wrapper).vm.$emit('search', 'REUNIAO')
      await flushPromises()

      expect(titles(wrapper)).toEqual(['Reunião de planejamento'])
    })

    it('shows what is being searched and how to leave the search', async () => {
      const { wrapper } = await mountDashboard()

      shell(wrapper).vm.$emit('search', 'bolo')
      await flushPromises()

      expect(wrapper.find('.search-summary').text()).toContain('Resultados para “bolo”')

      await wrapper.find('.search-summary .link-btn').trigger('click')
      expect(shell(wrapper).props('search')).toBe('')
      expect(titles(wrapper)).toHaveLength(3)
    })

    it('searches ALL notes, even from the folders view', async () => {
      const { wrapper } = await mountDashboard('/?view=folders')
      expect(tileNames(wrapper)).toContain('Trabalho')

      shell(wrapper).vm.$emit('search', 'bolo')
      await flushPromises()

      expect(titles(wrapper)).toEqual(['Receita de bolo'])
      expect(wrapper.find('.tile').exists()).toBe(false)
    })

    it('a search with no match says so and lets the user clear it', async () => {
      const { wrapper } = await mountDashboard()

      shell(wrapper).vm.$emit('search', 'zzz')
      await flushPromises()

      expect(wrapper.find('.empty-state').text()).toContain('Nenhum resultado')
      expect(wrapper.find('.empty-state').text()).toContain('zzz')
      expect(wrapper.find('.empty-state').text()).not.toContain('Nenhuma nota ainda')

      await wrapper.find('.empty-action').trigger('click')

      expect(titles(wrapper)).toHaveLength(3)
      expect(shell(wrapper).props('search')).toBe('')
    })

    it('works together with the Favoritas button', async () => {
      const { wrapper } = await mountDashboard()
      await wrapper.find('button.toggle').trigger('click')

      shell(wrapper).vm.$emit('search', 'reuniao')
      await flushPromises()

      // "Reunião" não é favorita: nenhum resultado entre as favoritas
      expect(wrapper.find('.empty-state').text()).toContain('Nenhum resultado')
    })

    it('changing the tab leaves the search', async () => {
      const { wrapper } = await mountDashboard()
      shell(wrapper).vm.$emit('search', 'bolo')
      await flushPromises()

      await tabs(wrapper)[1]!.trigger('click')
      await flushPromises()

      expect(shell(wrapper).props('search')).toBe('')
      expect(tileNames(wrapper)).toContain('Trabalho')
    })
  })

  // ---------- Excluir nota com "Desfazer"

  describe('deleting a note', () => {
    afterEach(() => vi.useRealTimers())

    it('hides the note at once, updates the counts, and offers to undo without calling the API yet', async () => {
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper) // 1ª da lista: "Reunião de planejamento" (pasta Trabalho)

      expect(titles(wrapper)).toEqual(['Receita de bolo', 'Relatório mensal'])
      expect(tabs(wrapper)[0]!.text()).toContain('2')
      expect(undoBar(wrapper).text()).toContain('Reunião de planejamento')
      expect(undoBar(wrapper).attributes('role')).toBe('status')
      expect(api.deleteNote).not.toHaveBeenCalled()

      await tabs(wrapper)[1]!.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.tile .tile-count')[1]!.text()).toBe('1 nota') // Trabalho: 2 -> 1
    })

    it('there is no browser confirm() dialog', async () => {
      const confirmFn = vi.fn(() => true)
      vi.stubGlobal('confirm', confirmFn)
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)

      expect(confirmFn).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    it('after the undo window the note is deleted in the API and the lists are refreshed', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)
      await vi.advanceTimersByTimeAsync(6000)

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(1)
      expect(api.getNotes).toHaveBeenCalledTimes(2)
      expect(api.getFolders).toHaveBeenCalledTimes(2)
      expect(undoBar(wrapper).exists()).toBe(false)
    })

    it('"Desfazer" brings the note back and the API is never called', async () => {
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)

      await wrapper.find('.undo-btn').trigger('click')
      await vi.advanceTimersByTimeAsync(10_000)

      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Receita de bolo', 'Relatório mensal'])
      expect(undoBar(wrapper).exists()).toBe(false)
      expect(api.deleteNote).not.toHaveBeenCalled()
    })

    it('a note waiting to be deleted does not come back when the list reloads', async () => {
      vi.mocked(api.createFolder).mockResolvedValue({} as any)
      const { wrapper } = await mountDashboard('/?view=folders')
      await tile(wrapper, 'Trabalho').find('.tile-open').trigger('click')
      await flushPromises()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper) // exclui "Reunião de planejamento"

      // Qualquer recarga (aqui, criar uma pasta) devolve a nota do servidor, que ainda não a apagou
      folderDialog(wrapper).vm.$emit('save', 'Nova')
      await vi.advanceTimersByTimeAsync(0)

      expect(titles(wrapper)).toEqual(['Relatório mensal'])
    })

    it('deleting a second note makes the first deletion final', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper) // "Reunião de planejamento"
      vi.mocked(api.getNotes).mockImplementation(async () => freshNotes().filter(n => n.id !== 1) as any) // o servidor já não tem a 1ª
      await deleteFromMenu(wrapper) // agora "Receita de bolo"

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(1)
      expect(undoBar(wrapper).text()).toContain('Receita de bolo')
    })

    it('if the API refuses, the user is told and the note comes back', async () => {
      vi.mocked(api.deleteNote).mockRejectedValue(new ApiError(500, 'Falha no servidor'))
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()

      await deleteFromMenu(wrapper)
      await vi.advanceTimersByTimeAsync(6000)

      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Falha no servidor' }))
      expect(titles(wrapper)).toHaveLength(3)
    })

    it('leaving the page with a pending deletion deletes right away', async () => {
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)

      wrapper.unmount()

      expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith(1)
    })

    it('deleting from inside the editor closes it and goes through the same undo', async () => {
      const { wrapper } = await mountDashboard()
      vi.useFakeTimers()
      await wrapper.findAll('.note-card')[2]!.trigger('click') // abre "Relatório mensal" no editor
      expect(form(wrapper).props('isOpen')).toBe(true)

      form(wrapper).vm.$emit('delete', notes[2])
      await flushPromises()

      expect(form(wrapper).props('isOpen')).toBe(false)
      expect(titles(wrapper)).toEqual(['Reunião de planejamento', 'Receita de bolo'])
      expect(undoBar(wrapper).text()).toContain('Relatório mensal')
      expect(api.deleteNote).not.toHaveBeenCalled()
    })
  })

  // ---------- Criar e salvar notas

  describe('saving notes', () => {
    const created = (extra: Record<string, unknown> = {}) => ({ id: 9, title: 'Roteiro', folderId: null, folder: null, tags: [], isPinned: false, ...extra })
    const emitSaved = (wrapper: Wrapper, extra: Record<string, unknown> = {}) =>
      form(wrapper).vm.$emit('saved', { title: 'Roteiro', content: '', folderId: null, folder: null, tags: [], isPinned: false, ...extra })

    it('saving closes the form, refreshes notes and folders, and tells the user', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created() as any)
      const { wrapper } = await mountDashboard()
      await wrapper.find('.btn-add').trigger('click')

      emitSaved(wrapper)
      await flushPromises()

      expect(form(wrapper).props('isOpen')).toBe(false)
      expect(form(wrapper).props('saving')).toBe(false)
      expect(api.getNotes).toHaveBeenCalledTimes(2)
      expect(api.getFolders).toHaveBeenCalledTimes(2)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Nota criada!' }))
    })

    it('a note in a brand-new folder sends only the name, and the new folder shows up', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created({ folderId: 3, folder: 'Viagens' }) as any)
      const { wrapper } = await mountDashboard('/?view=folders')
      vi.mocked(api.getFolders).mockResolvedValue([...freshFolders(), { id: 3, name: 'Viagens', noteCount: 1, createdAt: '' }] as any)

      emitSaved(wrapper, { folder: 'Viagens' })
      await flushPromises()

      expect(api.createNote).toHaveBeenCalledWith(expect.objectContaining({ folderId: null, folder: 'Viagens' }))
      expect(tileNames(wrapper)).toContain('Viagens')
    })

    it('tells the form it is saving while the API answers', async () => {
      let finish!: (note: any) => void
      vi.mocked(api.createNote).mockReturnValue(new Promise(resolve => (finish = resolve)))
      const { wrapper } = await mountDashboard()

      emitSaved(wrapper)
      await flushPromises()
      expect(form(wrapper).props('saving')).toBe(true)

      finish(created())
      await flushPromises()
      expect(form(wrapper).props('saving')).toBe(false)
    })

    it('if saving fails the form stays open and the user is told', async () => {
      vi.mocked(api.createNote).mockRejectedValue(new ApiError(400, 'Título é obrigatório'))
      const { wrapper } = await mountDashboard()
      await wrapper.find('.btn-add').trigger('click')

      emitSaved(wrapper)
      await flushPromises()

      expect(form(wrapper).props('isOpen')).toBe(true)
      expect(form(wrapper).props('saving')).toBe(false)
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Título é obrigatório' }))
    })

    it('editing a note updates it by id and does not touch where you are', async () => {
      vi.mocked(api.updateNote).mockResolvedValue({} as any)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=1')
      await wrapper.findAll('.note-card')[0]!.trigger('click')

      emitSaved(wrapper, { title: 'Outro', folderId: 2 })
      await flushPromises()

      expect(api.updateNote).toHaveBeenCalledWith(expect.objectContaining({ id: 1, title: 'Outro', folderId: 2 }))
      expect(query(router)).toEqual({ view: 'folders', folder: '1' })
    })

    it('a new note that lands outside the open folder takes you to all notes so you can see it', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created({ folderId: 2, folder: 'Pessoal' }) as any)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=1')

      emitSaved(wrapper, { folderId: 2 })
      await flushPromises()

      expect(query(router)).toEqual({})
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining('Mostrando todas as notas') }))
    })

    it('a new note that lands inside the open folder leaves you there', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created({ folderId: 1, folder: 'Trabalho' }) as any)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=1')

      emitSaved(wrapper, { folderId: 1 })
      await flushPromises()

      expect(query(router)).toEqual({ view: 'folders', folder: '1' })
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ detail: undefined }))
    })

    it('"Sem pasta" open: a new note with a folder takes you out of it', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created({ folderId: 1, folder: 'Trabalho' }) as any)
      const { wrapper, router } = await mountDashboard('/?view=folders&folder=none')

      emitSaved(wrapper, { folderId: 1 })
      await flushPromises()

      expect(query(router)).toEqual({})
    })

    it('a new note that lacks the open tag takes you to all notes', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created({ tags: ['outra'] }) as any)
      const { wrapper, router } = await mountDashboard('/?view=tags&tag=importante')

      emitSaved(wrapper, { tags: ['outra'] })
      await flushPromises()

      expect(query(router)).toEqual({})
    })

    it('a new note hidden by the search or by the Favoritas button is revealed too', async () => {
      vi.mocked(api.createNote).mockResolvedValue(created() as any)
      const { wrapper } = await mountDashboard()
      shell(wrapper).vm.$emit('search', 'bolo')
      await flushPromises()

      emitSaved(wrapper)
      await flushPromises()
      expect(shell(wrapper).props('search')).toBe('')

      await wrapper.find('button.toggle').trigger('click')
      emitSaved(wrapper)
      await flushPromises()
      expect(wrapper.find('button.toggle').attributes('aria-pressed')).toBe('false')
    })
  })

  // ---------- Erros

  describe('errors', () => {
    it('warns the user when loading fails (network)', async () => {
      vi.mocked(api.getNotes).mockRejectedValue(new ApiError(0, 'Não foi possível conectar ao servidor.'))

      await mountDashboard()

      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Não foi possível conectar ao servidor.' }))
    })

    it('does not toast on 401 (the session handler already sends the user to the login)', async () => {
      vi.mocked(api.getNotes).mockRejectedValue(new ApiError(401, 'Sessão expirada'))
      vi.mocked(api.getFolders).mockRejectedValue(new ApiError(401, 'Sessão expirada'))

      await mountDashboard()

      expect(toastAdd).not.toHaveBeenCalled()
    })

    it('does not blank the screen with a spinner after the first load', async () => {
      const { wrapper } = await mountDashboard()
      expect(wrapper.find('.loading').exists()).toBe(false)

      let release!: (value: any) => void
      vi.mocked(api.getNotes).mockReturnValue(new Promise(resolve => (release = resolve)))
      vi.mocked(api.deleteNote).mockResolvedValue(undefined)
      vi.useFakeTimers()
      await deleteFromMenu(wrapper)
      await vi.advanceTimersByTimeAsync(6000)

      expect(wrapper.find('.loading').exists()).toBe(false)
      expect(titles(wrapper)).toHaveLength(2)

      release(freshNotes().filter(n => n.id !== 1))
      await vi.advanceTimersByTimeAsync(0)
      vi.useRealTimers()
    })
  })
})
