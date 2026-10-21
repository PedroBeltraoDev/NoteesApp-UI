<template>
  <AppShell
    title="Notas"
    :search="searchQuery"
    :showSearch="true"
    :showFilters="true"
    :folders="folders"
    :tags="tags"
    :selectedFolder="selectedFolder"
    :selectedTag="selectedTag"
    @search="handleSearch"
    @selectFolder="selectFolder"
    @selectTag="selectTag"
    @clearFilters="clearFilters"
  >
    <div class="tabs-bar">
      <div class="tabs" role="tablist" aria-label="Visualização das notas" @keydown="onTabKeydown">
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
          @click="view = tab.key"
        >
          <i :class="tab.icon" aria-hidden="true"></i>
          {{ tab.label }}
          <span class="tab-count" aria-hidden="true">{{ tab.count }}</span>
          <span class="sr-only">({{ tab.count }})</span>
        </button>
      </div>

      <button type="button" class="btn-add" @click="handleCreateNote">
        <i class="pi pi-plus" aria-hidden="true"></i> Nova nota
      </button>
    </div>

    <div v-if="activeFilter" class="filter-row">
      <span class="active-filter">
        Filtrando por: {{ activeFilter }}
        <button
          @click="clearFilters"
          class="clear-filter"
          type="button"
          aria-label="Remover filtro"
          title="Remover filtro"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </span>
    </div>

    <div id="notes-panel" role="tabpanel" :aria-labelledby="`tab-${view}`">
      <div v-if="isLoading" class="loading" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>Carregando notas...</p>
      </div>

      <!-- Nenhuma nota ainda (conta nova) -->
      <div v-else-if="notes.length === 0 && !activeFilter" class="empty-state">
        <h2>
          <i class="pi pi-file-edit" aria-hidden="true"></i> Nenhuma nota ainda
        </h2>
        <p>Crie sua primeira nota para começar a organizar suas ideias.</p>
        <button type="button" class="empty-action primary" @click="handleCreateNote">
          <i class="pi pi-plus" aria-hidden="true"></i> Criar primeira nota
        </button>
      </div>

      <!-- Pasta ou tag sem notas -->
      <div v-else-if="notes.length === 0" class="empty-state">
        <h2>
          <i class="pi pi-filter-slash" aria-hidden="true"></i> Nada em {{ activeFilter }}
        </h2>
        <p>Não há notas com esse filtro.</p>
        <button type="button" class="empty-action" @click="clearFilters">Ver todas as notas</button>
      </div>

      <!-- Aba Favoritas vazia -->
      <div v-else-if="view === 'favorites' && favoritesCount === 0" class="empty-state">
        <h2>
          <i class="pi pi-star" aria-hidden="true"></i> Nenhuma favorita ainda
        </h2>
        <p>Toque na estrela de uma nota para ela aparecer aqui.</p>
        <button type="button" class="empty-action" @click="view = 'all'">Ver todas as notas</button>
      </div>

      <!-- A busca não encontrou nada -->
      <div v-else-if="visibleNotes.length === 0" class="empty-state" role="status">
        <h2>
          <i class="pi pi-search" aria-hidden="true"></i> Nenhum resultado
        </h2>
        <p>Nada encontrado para “{{ searchQuery }}”. Confira a grafia ou tente outras palavras.</p>
        <button type="button" class="empty-action" @click="clearSearch">Limpar busca</button>
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
    </div>

    <NoteFormModal
      :isOpen="isModalOpen"
      :note="editingNote"
      :folders="folders"
      :tags="tags"
      :defaultFolder="selectedFolder"
      :defaultTag="selectedTag"
      :saving="isSaving"
      @close="closeModal"
      @saved="saveNote"
      @delete="deleteFromEditor"
    />

    <!-- Excluir é imediato na tela e só vale de verdade depois do prazo: dá tempo de desfazer -->
    <div v-if="pendingDelete" class="undo-bar" role="status" aria-live="polite">
      <span class="undo-text">Nota “{{ pendingDelete.note.title }}” excluída</span>
      <button type="button" class="undo-btn" @click="undoDelete">Desfazer</button>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, computed } from 'vue'
import AppShell from '../components/layout/AppShell.vue'
import NoteCard from '../components/notes/NoteCard.vue'
import NoteFormModal from '../components/notes/NoteFormModal.vue'
import { api } from '@/services/api'
import { filterNotes } from '@/utils/search'
import { ApiError } from '@/services/http'
import { useToast } from 'primevue/usetoast'

type View = 'all' | 'favorites'

// DECLARAÇÕES
const notes = ref<any[]>([])
const folders = ref<string[]>([])
const tags = ref<string[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isModalOpen = ref(false)
const editingNote = ref<any>(null)
const searchQuery = ref('')
const selectedFolder = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const view = ref<View>('all')
const toast = useToast()

// Tempo para desfazer uma exclusão; só depois disso a nota é apagada no servidor
const UNDO_MS = 6000

interface PendingDelete {
  note: any
  timer: ReturnType<typeof setTimeout>
}

// shallowRef: a comparação por identidade (pendingDelete.value === pending) precisa do objeto original, não de um proxy
const pendingDelete = shallowRef<PendingDelete | null>(null)
let hasLoaded = false

// COMPUTED
const activeFilter = computed(() => {
  if (selectedFolder.value) return `Pasta: ${selectedFolder.value}`
  if (selectedTag.value) return `Tag: ${selectedTag.value}`
  return null
})

// Favoritas primeiro, depois as mais recentes
const sortedNotes = computed(() => {
  const sorted = [...notes.value]

  sorted.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return sorted
})

const favoritesCount = computed(() => notes.value.filter(n => n.isPinned).length)

const tabs = computed(() => [
  { key: 'all' as const, label: 'Todas as notas', icon: 'pi pi-file', count: notes.value.length },
  { key: 'favorites' as const, label: 'Favoritas', icon: 'pi pi-star', count: favoritesCount.value }
])

// Busca: filtra uma cópia, então apagar letras traz as notas de volta
const visibleNotes = computed(() => {
  const base = view.value === 'favorites' ? sortedNotes.value.filter(n => n.isPinned) : sortedNotes.value
  return filterNotes(base, searchQuery.value)
})

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
  view.value = order[next]!
  document.getElementById(`tab-${order[next]}`)?.focus()
}

// Falha de sessão (401) já é tratada redirecionando para o login: não precisa de toast.
// Qualquer outro erro da API (rede fora, servidor dormindo, 5xx) aparece para o usuário.
const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

const notifyError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) return
  toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error, fallback), life: 5000 })
}

const clearSearch = () => {
  searchQuery.value = ''
}

// O "Carregando..." aparece só na primeira carga; depois a lista continua na tela enquanto atualiza
const loadNotes = async () => {
  try {
    isLoading.value = !hasLoaded
    const loaded = await api.getNotes(selectedFolder.value ?? undefined, selectedTag.value ?? undefined)
    // Uma nota excluída que ainda pode ser desfeita continua no servidor, mas não volta para a tela
    notes.value = loaded.filter((n: any) => n.id !== pendingDelete.value?.note.id)
  } catch (error) {
    console.error('Erro ao buscar notas:', error)
    notes.value = []
    notifyError(error, 'Erro ao carregar as notas')
  } finally {
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

const loadTags = async () => {
  try {
    tags.value = await api.getTags()
  } catch (error) {
    console.error('Erro ao buscar tags:', error)
    notifyError(error, 'Erro ao carregar as tags')
  }
}

// Notas, pastas e tags andam juntas: criar/excluir uma nota pode criar ou fazer sumir uma pasta ou tag
const refreshAll = () => Promise.all([loadNotes(), loadFolders(), loadTags()])

const selectFolder = (folder: string) => {
  selectedFolder.value = folder
  selectedTag.value = null
  loadNotes()
}

const selectTag = (tag: string) => {
  selectedTag.value = tag
  selectedFolder.value = null
  loadNotes()
}

const clearFilters = () => {
  selectedFolder.value = null
  selectedTag.value = null
  loadNotes()
}

const handleCreateNote = () => {
  editingNote.value = null
  isModalOpen.value = true
}

const handleEditNote = (note: any) => {
  editingNote.value = note
  isModalOpen.value = true
}

// Apaga no servidor e atualiza as listas; se falhar, a nota volta para a tela
const commitDelete = async (pending: PendingDelete) => {
  clearTimeout(pending.timer)
  if (pendingDelete.value === pending) pendingDelete.value = null

  try {
    await api.deleteNote(pending.note.id)
  } catch (error: any) {
    console.error('Erro ao excluir nota:', error)
    notifyError(error, 'Erro ao excluir nota')
  }
  await refreshAll()
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
  await loadNotes()
}

const deleteFromEditor = (note: { id: number }) => {
  closeModal()
  handleDeleteNote(note.id)
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

// A nota nova precisa aparecer: se o filtro, a busca ou a aba escondem ela, eles saem do caminho
const revealIfHidden = (saved: any) => {
  let revealed = false

  const hiddenByFilter =
    (selectedFolder.value && saved.folder !== selectedFolder.value) ||
    (selectedTag.value && !(saved.tags ?? []).includes(selectedTag.value))
  if (hiddenByFilter) {
    selectedFolder.value = null
    selectedTag.value = null
    revealed = true
  }

  if (searchQuery.value && filterNotes([saved], searchQuery.value).length === 0) {
    searchQuery.value = ''
    revealed = true
  }

  if (view.value === 'favorites' && !saved.isPinned) {
    view.value = 'all'
    revealed = true
  }

  return revealed
}

const saveNote = async (noteData: any) => {
  isSaving.value = true

  try {
    if (editingNote.value) {
      await api.updateNote({ ...noteData, id: editingNote.value.id })
      toast.add({ severity: 'success', summary: 'Salvo!', detail: 'Nota atualizada.', life: 3000 })
    } else {
      const created = await api.createNote(noteData)
      const revealed = revealIfHidden(created ?? noteData)
      toast.add({
        severity: 'success',
        summary: 'Nota criada!',
        detail: revealed ? 'Mostrando todas as notas para você ver a nova.' : undefined,
        life: 3000
      })
    }

    closeModal()
    await refreshAll()
  } catch (error: any) {
    console.error('Erro ao salvar nota:', error)
    notifyError(error, 'Erro ao salvar nota. Tente novamente.')
  } finally {
    isSaving.value = false
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const closeModal = () => {
  isModalOpen.value = false
  editingNote.value = null
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
/* Abas + botão de criar (como no topo do painel de referência) */
.tabs-bar {
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

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 6px;
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

.filter-row {
  margin-bottom: 16px;
}

.active-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 14px;
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent-color) 40%, transparent);
  border-radius: 999px;
  color: var(--accent-text);
  font-size: 13px;
  font-weight: 600;
}

.clear-filter {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: inherit;
  cursor: pointer;
}

.clear-filter:hover {
  background: var(--accent-soft);
}

.clear-filter .pi-times {
  font-size: 12px;
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

/* Grade: 1 coluna no celular, até 4 no desktop largo */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

@media (max-width: 767px) {
  /* Botão de criar em largura total no topo; as abas ficam logo abaixo, com a linha de base */
  .tabs-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .btn-add {
    order: -1;
    justify-content: center;
    margin-bottom: 4px;
  }

  .tabs {
    width: 100%;
  }

  .tab {
    flex: 1;
    justify-content: center;
    padding: 0 8px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
