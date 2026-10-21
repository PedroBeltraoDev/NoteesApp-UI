<template>
  <AppShell title="Notas" :search="searchQuery" :showSearch="true" @search="handleSearch">
    <div class="toolbar">
      <div class="tabs" role="tablist" aria-label="Como ver as notas" @keydown="onTabKeydown">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.key}`"
          :key="tab.key"
          type="button"
          role="tab"
          class="tab"
          :class="{ active: view === tab.key }"
          :aria-selected="view === tab.key"
          :tabindex="view === tab.key ? 0 : -1"
          aria-controls="notes-panel"
          @click="setView(tab.key)"
        >
          <i :class="tab.icon" aria-hidden="true"></i>
          <span>{{ tab.label }}<span v-if="tab.extra" class="tab-extra">{{ tab.extra }}</span></span>
          <span class="tab-count" aria-hidden="true">{{ tab.count }}</span>
          <span class="sr-only">({{ tab.count }})</span>
        </button>
      </div>

      <div class="toolbar-actions">
        <template v-if="showListControls">
          <label class="sort">
            <span class="sort-label">Ordem</span>
            <select v-model="sortMode" class="sort-select" aria-label="Ordenar as notas por data">
              <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <button
            type="button"
            class="toggle"
            :class="{ active: favoritesOnly }"
            :aria-pressed="favoritesOnly"
            @click="favoritesOnly = !favoritesOnly"
          >
            <i :class="favoritesOnly ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i> Favoritas
          </button>
        </template>

        <button type="button" class="btn-add" @click="handleCreateNote">
          <i class="pi pi-plus" aria-hidden="true"></i> Nova nota
        </button>
      </div>
    </div>

    <!-- Onde você está: Pastas > Trabalho, Tags > dotnet -->
    <div v-if="mode === 'folder' || mode === 'tag'" class="scope-head">
      <nav class="breadcrumb" aria-label="Você está em">
        <ol>
          <li>
            <button type="button" class="crumb-link" @click="setView(mode === 'folder' ? 'folders' : 'tags')">
              {{ mode === 'folder' ? 'Pastas' : 'Tags' }}
            </button>
          </li>
          <li aria-current="page" class="crumb-current">
            <i :class="mode === 'folder' ? (openFolder?.kind === 'none' ? 'pi pi-inbox' : 'pi pi-folder') : 'pi pi-hashtag'" aria-hidden="true"></i>
            {{ scopeTitle }}
          </li>
        </ol>
      </nav>

      <div v-if="openFolder?.kind === 'folder'" class="scope-actions">
        <button type="button" class="link-btn" @click="openRenameFolder(openFolder.folder)">
          <i class="pi pi-pencil" aria-hidden="true"></i> Renomear
        </button>
        <button type="button" class="link-btn danger" @click="askDeleteFolder(openFolder.folder)">
          <i class="pi pi-trash" aria-hidden="true"></i> Excluir pasta
        </button>
      </div>
    </div>

    <!-- Busca: resultados de todas as notas, onde quer que você esteja -->
    <div v-if="mode === 'search'" class="scope-head">
      <p class="search-summary" role="status">
        Resultados para “{{ searchQuery.trim() }}”
        <button type="button" class="link-btn" @click="clearSearch">Limpar busca</button>
      </p>
    </div>

    <div id="notes-panel" role="tabpanel" :aria-labelledby="`tab-${view}`">
      <div v-if="isLoading" class="loading" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>{{ slowLoad ? 'O servidor estava dormindo e está acordando. Isso leva alguns segundos só na primeira vez.' : 'Carregando notas...' }}</p>
      </div>

      <!-- Pastas: escolha uma para entrar nela -->
      <template v-else-if="mode === 'folders'">
        <p v-if="folders.length === 0" class="hint">Pastas agrupam as suas notas. Crie a primeira e depois guarde notas dentro dela.</p>

        <div class="tiles">
          <CollectionTile
            v-if="countsByFolder.get(null)"
            name="Sem pasta"
            icon="pi pi-inbox"
            :count="countsByFolder.get(null) ?? 0"
            @open="openNoFolder"
          />
          <CollectionTile
            v-for="folder in folders"
            :key="folder.id"
            :name="folder.name"
            :count="countsByFolder.get(folder.id) ?? 0"
            :color="noteColorVar(folder.name)"
            :menuItems="folderMenu"
            @open="openFolderById(folder.id)"
            @menu="onFolderMenu(folder, $event)"
          />
          <button type="button" class="tile-add" @click="openCreateFolder">
            <i class="pi pi-plus" aria-hidden="true"></i> Nova pasta
          </button>
        </div>
      </template>

      <!-- Tags: escolha uma para ver as notas que a usam -->
      <template v-else-if="mode === 'tags'">
        <div v-if="tagList.length === 0" class="empty-state">
          <h2><i class="pi pi-hashtag" aria-hidden="true"></i> Nenhuma tag ainda</h2>
          <p>Tags são rótulos livres. Adicione tags ao criar uma nota e elas aparecem aqui.</p>
        </div>

        <div v-else class="tiles">
          <CollectionTile
            v-for="tag in tagList"
            :key="tag.name"
            :name="tag.name"
            :count="tag.count"
            icon="pi pi-hashtag"
            :color="noteColorVar(tag.name)"
            @open="openTagNamed(tag.name)"
          />
        </div>
      </template>

      <!-- A pasta da URL não existe (foi excluída ou o link está velho) -->
      <div v-else-if="mode === 'folder' && !openFolder" class="empty-state">
        <h2><i class="pi pi-folder-open" aria-hidden="true"></i> Pasta não encontrada</h2>
        <p>Ela pode ter sido excluída. Volte para a lista de pastas.</p>
        <button type="button" class="empty-action" @click="setView('folders')">Ver pastas</button>
      </div>

      <!-- Lista de notas (todas, de uma pasta, de uma tag ou resultado de busca) -->
      <template v-else>
        <div v-if="notes.length === 0" class="empty-state">
          <h2><i class="pi pi-file-edit" aria-hidden="true"></i> Nenhuma nota ainda</h2>
          <p>Crie sua primeira nota para começar a organizar suas ideias.</p>
          <button type="button" class="empty-action primary" @click="handleCreateNote">
            <i class="pi pi-plus" aria-hidden="true"></i> Criar primeira nota
          </button>
        </div>

        <div v-else-if="visibleNotes.length === 0" class="empty-state" role="status">
          <template v-if="mode === 'search'">
            <h2><i class="pi pi-search" aria-hidden="true"></i> Nenhum resultado</h2>
            <p>Nada encontrado para “{{ searchQuery.trim() }}”. Confira a grafia ou tente outras palavras.</p>
            <button type="button" class="empty-action" @click="clearSearch">Limpar busca</button>
          </template>
          <template v-else-if="favoritesOnly">
            <h2><i class="pi pi-star" aria-hidden="true"></i> Nenhuma favorita aqui</h2>
            <p>Toque na estrela de uma nota para ela aparecer entre as favoritas.</p>
            <button type="button" class="empty-action" @click="favoritesOnly = false">Mostrar todas</button>
          </template>
          <template v-else-if="mode === 'folder'">
            <h2><i class="pi pi-folder-open" aria-hidden="true"></i> {{ openFolder?.kind === 'none' ? 'Nenhuma nota sem pasta' : 'Esta pasta está vazia' }}</h2>
            <p>{{ openFolder?.kind === 'none' ? 'Todas as suas notas estão em alguma pasta.' : 'Crie uma nota aqui ou escolha esta pasta ao editar outra nota.' }}</p>
            <button v-if="openFolder?.kind === 'folder'" type="button" class="empty-action primary" @click="handleCreateNote">
              <i class="pi pi-plus" aria-hidden="true"></i> Criar nota nesta pasta
            </button>
          </template>
          <template v-else>
            <h2><i class="pi pi-hashtag" aria-hidden="true"></i> Nenhuma nota com essa tag</h2>
            <p>Nenhuma nota usa a tag “{{ tagParam }}” agora.</p>
            <button type="button" class="empty-action" @click="setView('tags')">Ver tags</button>
          </template>
        </div>

        <div v-else class="notes-grid">
          <NoteCard
            v-for="note in visibleNotes"
            :key="note.id"
            :note="note"
            @edit="handleEditNote"
            @delete="handleDeleteNote"
            @togglePin="handleTogglePin"
          />
        </div>
      </template>
    </div>

    <NoteFormModal
      :isOpen="isModalOpen"
      :note="editingNote"
      :folders="folders"
      :tags="tagNames"
      :defaultFolderId="defaultFolderId"
      :defaultTag="defaultTag"
      :saving="isSaving"
      @close="closeModal"
      @saved="saveNote"
      @delete="deleteFromEditor"
    />

    <FolderNameDialog
      :isOpen="folderDialog.open"
      :folder="folderDialog.folder"
      :error="folderDialog.error"
      :saving="folderDialog.saving"
      @close="closeFolderDialog"
      @save="saveFolder"
    />

    <ConfirmDialog
      :isOpen="!!folderToDelete"
      title="Excluir pasta?"
      :message="deleteFolderMessage"
      confirmLabel="Excluir pasta"
      :busy="deletingFolder"
      @cancel="folderToDelete = null"
      @confirm="confirmDeleteFolder"
    />

    <!-- Excluir é imediato na tela e só vale de verdade depois do prazo: dá tempo de desfazer -->
    <div v-if="pendingDelete" class="undo-bar" role="status" aria-live="polite">
      <span class="undo-text">Nota “{{ pendingDelete.note.title }}” excluída</span>
      <button type="button" class="undo-btn" @click="undoDelete">Desfazer</button>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import NoteCard from '../components/notes/NoteCard.vue'
import NoteFormModal from '../components/notes/NoteFormModal.vue'
import FolderNameDialog from '../components/notes/FolderNameDialog.vue'
import CollectionTile from '../components/common/CollectionTile.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import type { KebabItem } from '../components/common/KebabMenu.vue'
import { api } from '@/services/api'
import { filterNotes } from '@/utils/search'
import { noteColorVar } from '@/utils/noteColor'
import {
  SORT_OPTIONS,
  DEFAULT_SORT,
  isSortMode,
  sortNotes,
  tagCounts,
  hasTag,
  notesInFolder,
  type SortMode
} from '@/utils/notesView'
import { ApiError } from '@/services/http'
import type { Note } from '@/types/Note'
import type { Folder } from '@/types/Folder'
import { useToast } from 'primevue/usetoast'

type View = 'all' | 'folders' | 'tags'
type Mode = 'all' | 'folders' | 'folder' | 'tags' | 'tag' | 'search'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// DADOS: carregados uma vez; pastas, tags, busca e ordem são aplicadas aqui, sem ir ao servidor
const notes = ref<Note[]>([])
const folders = ref<Folder[]>([])
const isLoading = ref(true)
// A API serverless dorme quando fica parada: se a primeira carga demora, explicamos em vez de deixar só um spinner
const slowLoad = ref(false)
const SLOW_LOAD_MS = 2500
const isSaving = ref(false)
const isModalOpen = ref(false)
const editingNote = ref<Note | null>(null)
const searchQuery = ref('')
const favoritesOnly = ref(false)

// ORDEM: preferência guardada no navegador
const SORT_KEY = 'noteesapp-sort'
const readSort = (): SortMode => {
  try {
    const stored = localStorage.getItem(SORT_KEY)
    if (isSortMode(stored)) return stored
  } catch {
    // localStorage indisponível: usa a ordem padrão
  }
  return DEFAULT_SORT
}
const sortMode = ref<SortMode>(readSort())
watch(sortMode, value => {
  try {
    localStorage.setItem(SORT_KEY, value)
  } catch {
    // a preferência vale só para esta sessão
  }
})

// EXCLUIR NOTA: tempo para desfazer; só depois disso a nota é apagada no servidor
const UNDO_MS = 6000

interface PendingDelete {
  note: Note
  timer: ReturnType<typeof setTimeout>
}

// shallowRef: a comparação por identidade (pendingDelete.value === pending) precisa do objeto original, não de um proxy
const pendingDelete = shallowRef<PendingDelete | null>(null)
let hasLoaded = false

// ONDE ESTOU: a URL guarda a visão e a pasta/tag aberta (?view=folders&folder=3), então Voltar e links funcionam
const queryText = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

const view = computed<View>(() => {
  const value = queryText(route.query.view)
  return value === 'folders' || value === 'tags' ? value : 'all'
})
const folderParam = computed(() => (view.value === 'folders' ? queryText(route.query.folder) : null))
const tagParam = computed(() => (view.value === 'tags' ? queryText(route.query.tag) : null))

const mode = computed<Mode>(() => {
  if (searchQuery.value.trim()) return 'search'
  if (view.value === 'folders') return folderParam.value ? 'folder' : 'folders'
  if (view.value === 'tags') return tagParam.value ? 'tag' : 'tags'
  return 'all'
})

// A pasta aberta: "Sem pasta" (folder=none), uma pasta real, ou nada se o id não existir
type OpenFolder = { kind: 'none' } | { kind: 'folder'; folder: Folder }

const openFolder = computed<OpenFolder | null>(() => {
  if (mode.value !== 'folder') return null
  if (folderParam.value === 'none') return { kind: 'none' }

  const folder = folders.value.find(f => String(f.id) === folderParam.value)
  return folder ? { kind: 'folder', folder } : null
})

const scopeTitle = computed(() => {
  if (mode.value === 'tag') return tagParam.value ?? ''
  if (openFolder.value?.kind === 'none') return 'Sem pasta'
  return openFolder.value?.kind === 'folder' ? openFolder.value.folder.name : 'Pasta não encontrada'
})

// NÚMEROS
const countsByFolder = computed(() => {
  const counts = new Map<number | null, number>()
  for (const note of notes.value) {
    const key = note.folderId ?? null
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
})

const tagList = computed(() => tagCounts(notes.value))
const tagNames = computed(() => tagList.value.map(tag => tag.name))

const tabs = computed(() => [
  // "extra" some visualmente no celular (falta espaço) mas continua para leitores de tela: "Todas as notas"
  { key: 'all' as const, label: 'Todas', extra: ' as notas', icon: 'pi pi-file', count: notes.value.length },
  { key: 'folders' as const, label: 'Pastas', extra: '', icon: 'pi pi-folder', count: folders.value.length },
  { key: 'tags' as const, label: 'Tags', extra: '', icon: 'pi pi-hashtag', count: tagList.value.length }
])

// O QUE APARECE: as notas do lugar onde estou, só as favoritas se pedido, a busca e a ordem por data
const scopeNotes = computed<Note[]>(() => {
  if (mode.value === 'folder') {
    if (openFolder.value?.kind === 'none') return notesInFolder(notes.value, null)
    return openFolder.value?.kind === 'folder' ? notesInFolder(notes.value, openFolder.value.folder.id) : []
  }
  if (mode.value === 'tag') return notes.value.filter(note => hasTag(note, tagParam.value ?? ''))
  return notes.value
})

const visibleNotes = computed(() => {
  const base = favoritesOnly.value ? scopeNotes.value.filter(note => note.isPinned) : scopeNotes.value
  return sortNotes(filterNotes(base, searchQuery.value), sortMode.value)
})

// Ordem e favoritas só fazem sentido quando há uma lista de notas na tela (não nas grades de pastas/tags)
const showListControls = computed(() => mode.value !== 'folders' && mode.value !== 'tags')

// Ao criar uma nota, ela já vem na pasta/tag em que estou
const defaultFolderId = computed(() => (openFolder.value?.kind === 'folder' ? openFolder.value.folder.id : null))
const defaultTag = computed(() => (mode.value === 'tag' ? tagParam.value : null))

// NAVEGAÇÃO
const go = (query: Record<string, string>) => router.push({ path: '/', query })

const setView = (next: View) => {
  searchQuery.value = ''
  go(next === 'all' ? {} : { view: next })
}

const openFolderById = (id: number) => go({ view: 'folders', folder: String(id) })
const openNoFolder = () => go({ view: 'folders', folder: 'none' })
const openTagNamed = (name: string) => go({ view: 'tags', tag: name })

// Setas, Home e End movem entre as abas (padrão de abas acessíveis)
const onTabKeydown = (event: KeyboardEvent) => {
  const order = tabs.value.map(t => t.key)
  const current = order.indexOf(view.value)
  let next = current

  if (event.key === 'ArrowRight') next = (current + 1) % order.length
  else if (event.key === 'ArrowLeft') next = (current - 1 + order.length) % order.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = order.length - 1
  else return

  event.preventDefault()
  setView(order[next]!)
  document.getElementById(`tab-${order[next]}`)?.focus()
}

// ERROS: falha de sessão (401) já é tratada redirecionando para o login: não precisa de toast.
// Qualquer outro erro da API (rede fora, servidor dormindo, 5xx) aparece para o usuário.
const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

const notifyError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) return
  toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error, fallback), life: 5000 })
}

// CARGA
// O "Carregando..." aparece só na primeira carga; depois a lista continua na tela enquanto atualiza
const loadNotes = async () => {
  const slowTimer = hasLoaded ? null : setTimeout(() => (slowLoad.value = true), SLOW_LOAD_MS)

  try {
    isLoading.value = !hasLoaded
    const loaded = await api.getNotes()
    // Uma nota excluída que ainda pode ser desfeita continua no servidor, mas não volta para a tela
    notes.value = loaded.filter(n => n.id !== pendingDelete.value?.note.id)
  } catch (error) {
    console.error('Erro ao buscar notas:', error)
    notes.value = []
    notifyError(error, 'Erro ao carregar as notas')
  } finally {
    if (slowTimer) clearTimeout(slowTimer)
    slowLoad.value = false
    hasLoaded = true
    isLoading.value = false
  }
}

const loadFolders = async () => {
  try {
    folders.value = await api.getFolders()
  } catch (error) {
    console.error('Erro ao buscar pastas:', error)
    notifyError(error, 'Erro ao carregar as pastas')
  }
}

// Notas e pastas andam juntas: criar/excluir uma nota pode criar uma pasta, excluir uma pasta solta as notas
const refreshAll = () => Promise.all([loadNotes(), loadFolders()])

// BUSCA
const handleSearch = (query: string) => {
  searchQuery.value = query
}

const clearSearch = () => {
  searchQuery.value = ''
}

// NOTAS: criar, abrir (editar), favoritar, excluir
const handleCreateNote = () => {
  editingNote.value = null
  isModalOpen.value = true
}

const handleEditNote = (note: Note) => {
  editingNote.value = note
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingNote.value = null
}

// A estrela muda na hora; se a API recusar, volta ao que era
const handleTogglePin = async (id: number) => {
  const note = notes.value.find(n => n.id === id)
  if (!note) return

  const next = !note.isPinned
  note.isPinned = next

  try {
    await api.updateNote({ ...note, isPinned: next })
  } catch (error: any) {
    console.error('Erro ao atualizar nota:', error)
    note.isPinned = !next
    notifyError(error, 'Erro ao atualizar nota')
  }
}

// Apaga no servidor. A nota já saiu da tela e as contagens vêm das notas carregadas, então não há o que recarregar;
// só se o servidor recusar a nota volta para a tela
const commitDelete = async (pending: PendingDelete) => {
  clearTimeout(pending.timer)
  if (pendingDelete.value === pending) pendingDelete.value = null

  try {
    await api.deleteNote(pending.note.id)
  } catch (error: any) {
    console.error('Erro ao excluir nota:', error)
    notifyError(error, 'Erro ao excluir nota')
    await loadNotes()
  }
}

const handleDeleteNote = async (id: number) => {
  const note = notes.value.find(n => n.id === id)
  if (!note) return

  // Só há um "Desfazer" por vez: a exclusão anterior passa a valer
  if (pendingDelete.value) await commitDelete(pendingDelete.value)

  notes.value = notes.value.filter(n => n.id !== id)
  const pending: PendingDelete = { note, timer: setTimeout(() => commitDelete(pending), UNDO_MS) }
  pendingDelete.value = pending
}

const undoDelete = async () => {
  const pending = pendingDelete.value
  if (!pending) return

  clearTimeout(pending.timer)
  pendingDelete.value = null
  // A nota ainda está no servidor (a exclusão só vale depois do prazo): basta devolvê-la à tela
  notes.value = [...notes.value, pending.note]
}

const deleteFromEditor = (note: { id: number }) => {
  closeModal()
  handleDeleteNote(note.id)
}

// A nota nova precisa aparecer: se a pasta/tag aberta, a busca ou as favoritas a escondem, eles saem do caminho
const revealIfHidden = (saved: Note) => {
  let revealed = false

  const openFolderId = openFolder.value?.kind === 'folder' ? openFolder.value.folder.id : null
  const outsideFolder =
    mode.value === 'folder' &&
    (openFolder.value?.kind === 'none' ? (saved.folderId ?? null) !== null : (saved.folderId ?? null) !== openFolderId)
  const outsideTag = mode.value === 'tag' && !hasTag(saved, tagParam.value ?? '')

  if (outsideFolder || outsideTag) {
    go({})
    revealed = true
  }

  if (searchQuery.value && filterNotes([saved], searchQuery.value).length === 0) {
    searchQuery.value = ''
    revealed = true
  }

  if (favoritesOnly.value && !saved.isPinned) {
    favoritesOnly.value = false
    revealed = true
  }

  return revealed
}

const saveNote = async (noteData: any) => {
  isSaving.value = true

  try {
    // A resposta da API já traz a nota salva: atualiza a tela com ela em vez de buscar tudo de novo
    if (editingNote.value) {
      const updated = await api.updateNote({ ...noteData, id: editingNote.value.id })
      if (updated?.id) notes.value = notes.value.map(n => (n.id === updated.id ? updated : n))
      else await loadNotes()
      toast.add({ severity: 'success', summary: 'Salvo!', detail: 'Nota atualizada.', life: 3000 })
    } else {
      const created = await api.createNote(noteData)
      const revealed = revealIfHidden(created ?? noteData)
      if (created?.id) notes.value = [...notes.value, created]
      else await loadNotes()
      toast.add({
        severity: 'success',
        summary: 'Nota criada!',
        detail: revealed ? 'Mostrando todas as notas para você ver a nova.' : undefined,
        life: 3000
      })
    }

    // Uma pasta nova (criada junto com a nota) só se conhece pelo servidor
    if (noteData.folder) await loadFolders()

    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar nota:', error)
    notifyError(error, 'Erro ao salvar nota. Tente novamente.')
  } finally {
    isSaving.value = false
  }
}

// PASTAS: criar, renomear e excluir (excluir nunca apaga as notas)
// Mesma ordem da API: por nome, sem diferenciar maiúsculas
const sortFolders = (list: Folder[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))

const folderMenu: KebabItem[] = [
  { key: 'rename', label: 'Renomear', icon: 'pi pi-pencil' },
  { key: 'delete', label: 'Excluir pasta', icon: 'pi pi-trash', danger: true }
]

const folderDialog = reactive<{ open: boolean; folder: Folder | null; error: string; saving: boolean }>({
  open: false,
  folder: null,
  error: '',
  saving: false
})

const openCreateFolder = () => {
  Object.assign(folderDialog, { open: true, folder: null, error: '', saving: false })
}

const openRenameFolder = (folder: Folder) => {
  Object.assign(folderDialog, { open: true, folder, error: '', saving: false })
}

const closeFolderDialog = () => {
  folderDialog.open = false
}

const saveFolder = async (name: string) => {
  folderDialog.saving = true
  folderDialog.error = ''

  try {
    if (folderDialog.folder) {
      const renamed = await api.renameFolder(folderDialog.folder.id, name)
      const id = folderDialog.folder.id
      const newName = renamed?.name ?? name
      folders.value = sortFolders(folders.value.map(f => (f.id === id ? { ...f, name: newName } : f)))
      // As notas guardam o nome da pasta para o cartão mostrar
      notes.value = notes.value.map(n => (n.folderId === id ? { ...n, folder: newName } : n))
      toast.add({ severity: 'success', summary: 'Pasta renomeada!', life: 3000 })
    } else {
      const created = await api.createFolder(name)
      if (created?.id) folders.value = sortFolders([...folders.value, created])
      else await loadFolders()
      toast.add({ severity: 'success', summary: 'Pasta criada!', life: 3000 })
    }

    closeFolderDialog()
  } catch (error: any) {
    console.error('Erro ao salvar pasta:', error)

    // Nome repetido: o aviso fica no próprio campo, onde dá para corrigir
    if (error instanceof ApiError && (error.status === 409 || error.status === 400)) folderDialog.error = error.message
    else notifyError(error, 'Erro ao salvar a pasta. Tente novamente.')
  } finally {
    folderDialog.saving = false
  }
}

const onFolderMenu = (folder: Folder, key: string) => {
  if (key === 'rename') openRenameFolder(folder)
  else if (key === 'delete') askDeleteFolder(folder)
}

const folderToDelete = ref<Folder | null>(null)
const deletingFolder = ref(false)

const askDeleteFolder = (folder: Folder) => {
  folderToDelete.value = folder
}

const deleteFolderMessage = computed(() => {
  const folder = folderToDelete.value
  if (!folder) return ''

  const count = countsByFolder.value.get(folder.id) ?? 0
  const detail =
    count === 0
      ? 'Ela está vazia.'
      : `${count === 1 ? 'A nota' : `As ${count} notas`} dentro dela não ${count === 1 ? 'será apagada' : 'serão apagadas'}: ${count === 1 ? 'fica' : 'ficam'} em “Sem pasta”.`

  return `Excluir a pasta “${folder.name}”? ${detail}`
})

const confirmDeleteFolder = async () => {
  const folder = folderToDelete.value
  if (!folder) return

  deletingFolder.value = true
  const count = countsByFolder.value.get(folder.id) ?? 0

  try {
    await api.deleteFolder(folder.id)
    folderToDelete.value = null
    toast.add({
      severity: 'info',
      summary: 'Pasta excluída',
      detail: count > 0 ? `${count === 1 ? 'A nota está' : `As ${count} notas estão`} em “Sem pasta”.` : undefined,
      life: 4000
    })

    // Se eu estava dentro dela, volto para a lista de pastas
    if (openFolder.value?.kind === 'folder' && openFolder.value.folder.id === folder.id) setView('folders')

    // O servidor deixou as notas sem pasta; a tela faz o mesmo sem recarregar
    folders.value = folders.value.filter(f => f.id !== folder.id)
    notes.value = notes.value.map(n => (n.folderId === folder.id ? { ...n, folderId: null, folder: null } : n))
  } catch (error: any) {
    console.error('Erro ao excluir pasta:', error)
    notifyError(error, 'Erro ao excluir a pasta')
  } finally {
    deletingFolder.value = false
  }
}

onMounted(refreshAll)

// Sair da tela com uma exclusão pendente: o prazo acaba aqui, a nota é apagada agora
onBeforeUnmount(() => {
  const pending = pendingDelete.value
  if (!pending) return

  clearTimeout(pending.timer)
  api.deleteNote(pending.note.id).catch(() => {})
})
</script>

<style scoped>
/* Abas (Todas | Pastas | Tags) + ordem, favoritas e botão de criar */
.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border-color);
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 14px;
  margin-bottom: -1px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent-text);
  border-bottom-color: var(--accent-color);
}

.tab {
  white-space: nowrap;
}

.tab .pi {
  font-size: 16px;
}

.tab-count {
  min-width: 22px;
  padding: 1px 7px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--text-secondary);
}

.tab.active .tab-count {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.sort {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.sort-select {
  min-height: 40px;
  padding: 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.sort-select:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.toggle:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toggle.active {
  color: var(--star);
  border-color: color-mix(in srgb, var(--star) 55%, transparent);
  background: color-mix(in srgb, var(--star) 12%, transparent);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  background: var(--accent-strong);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.btn-add:hover {
  background: #166534;
}

.btn-add:active {
  transform: translateY(1px);
}

/* Caminho (Pastas > Trabalho) e ações da pasta aberta */
.scope-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 16px;
}

.breadcrumb ol {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 15px;
}

.breadcrumb li + li::before {
  content: '›';
  margin-right: 6px;
  color: var(--text-tertiary);
}

.crumb-link {
  padding: 4px 6px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--accent-text);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.crumb-link:hover {
  background: var(--accent-soft);
}

.crumb-current {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.crumb-current .pi {
  color: var(--accent-text);
}

.scope-actions {
  display: flex;
  gap: 4px;
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.link-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.link-btn.danger {
  color: var(--danger);
}

.link-btn.danger:hover {
  background: var(--danger-soft);
}

.search-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.hint {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 56px 20px;
}

.empty-state h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state h2 .pi {
  font-size: 24px;
  color: var(--accent-text);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-top: 18px;
  padding: 0 20px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.empty-action:hover {
  background: var(--hover-bg);
}

.empty-action.primary {
  background: var(--accent-strong);
  border-color: transparent;
  color: #ffffff;
}

.empty-action.primary:hover {
  background: #166534;
}

/* Aviso de exclusão com "Desfazer" */
.undo-bar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 32px);
  padding: 10px 10px 10px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-size: 14px;
}

.undo-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.undo-btn {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 14px;
  background: var(--accent-soft);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--accent-text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.undo-btn:hover {
  background: var(--accent-glow);
}

/* Grade de notas: 1 coluna no celular, até 4 no desktop largo */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* Grade de pastas / tags */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.tile-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 74px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.tile-add:hover {
  background: var(--accent-soft);
  border-color: var(--accent-color);
  color: var(--accent-text);
}

@media (max-width: 767px) {
  /* Botão de criar em largura total no topo; as abas ficam logo abaixo, com a linha de base */
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-actions {
    order: -1;
    margin-bottom: 4px;
  }

  .btn-add {
    flex: 1 1 100%;
    order: -1;
    justify-content: center;
  }

  /* Ordem e Favoritas dividem a mesma linha: o select encolhe, o botão não */
  .sort {
    flex: 1;
    min-width: 0;
  }

  .sort-select {
    flex: 1;
    min-width: 0;
  }

  .toggle {
    flex-shrink: 0;
  }

  .tab-extra {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .tabs {
    width: 100%;
  }

  .tab {
    flex: 1;
    justify-content: center;
    padding: 0 6px;
    gap: 6px;
  }

  .notes-grid,
  .tiles {
    grid-template-columns: 1fr;
  }
}

/* Telas muito estreitas: sem os ícones as três abas cabem na linha */
@media (max-width: 400px) {
  .tab .pi {
    display: none;
  }
}
</style>
