<template>
  <div class="dashboard">
    <a href="#conteudo" class="skip-link">Pular para o conteúdo</a>
    <Topbar :search="searchQuery" @search="handleSearch" @createNote="handleCreateNote" />

    <div class="main-container">
      <!-- Sidebar -->
      <Sidebar
        ref="sidebarRef"
        :folders="folders"
        :tags="tags"
        :selectedFolder="selectedFolder"
        :selectedTag="selectedTag"
        @selectFolder="selectFolder"
        @selectTag="selectTag"
        @clearFilters="clearFilters"
        v-model:mobileOpen="isMobileMenuOpen"
      />

      <!-- Conteúdo Principal -->
      <main class="content" id="conteudo" tabindex="-1">
        <div class="workspace-header">
          <div class="header-left">
            <h1 class="workspace-title">Minhas Notas</h1>
            <span v-if="activeFilter" class="active-filter">
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
        </div>

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
          <button type="button" class="empty-action" @click="handleCreateNote">
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
      </main>
    </div>

    <NoteFormModal
      :isOpen="isModalOpen"
      :note="editingNote"
      :folders="folders"
      @close="closeModal"
      @saved="saveNote"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import Topbar from '../components/layout/Topbar.vue'
import Sidebar from '../components/layout/Sidebar.vue'
import NoteCard from '../components/notes/NoteCard.vue'
import NoteFormModal from '../components/notes/NoteFormModal.vue'
import { api } from '@/services/api'
import { filterNotes } from '@/utils/search'
import { ApiError } from '@/services/http'
import { useToast } from 'primevue/usetoast'

// DECLARAÇÕES
const notes = ref<any[]>([])
const folders = ref<string[]>([])
const tags = ref<string[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const editingNote = ref<any>(null)
const searchQuery = ref('')
const selectedFolder = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const sidebarRef = ref<any>(null)
const toast = useToast()
const isMobileMenuOpen = ref(false)

// COMPUTED
const activeFilter = computed(() => {
  if (selectedFolder.value) return `Pasta: ${selectedFolder.value}`
  if (selectedTag.value) return `Tag: ${selectedTag.value}`
  return null
})

const sortedNotes = computed(() => {
  let sorted = [...notes.value]
  
  sorted.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  
  return sorted
})

// Falha de sessão (401) já é tratada redirecionando para o login: não precisa de toast.
// Qualquer outro erro da API (rede fora, servidor dormindo, 5xx) aparece para o usuário.
const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

const notifyError = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.status === 401) return
  toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error, fallback), life: 5000 })
}

// Busca: filtra uma cópia, então apagar letras traz as notas de volta
const visibleNotes = computed(() => filterNotes(sortedNotes.value, searchQuery.value))

const clearSearch = () => {
  searchQuery.value = ''
}

// Notas, pastas e tags andam juntas: criar/excluir uma nota pode criar ou fazer sumir uma pasta ou tag
const refreshAll = () => Promise.all([loadNotes(), loadFolders(), loadTags()])

const loadNotes = async () => {
  try {
    isLoading.value = true
    notes.value = await api.getNotes(
      selectedFolder.value ?? undefined, 
      selectedTag.value ?? undefined
    )
  } catch (error) {
    console.error('Erro ao buscar notas:', error)
    notes.value = []
    notifyError(error, 'Erro ao carregar as notas')
  } finally {
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

const handleDeleteNote = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir esta nota?')) {
    try {
      await api.deleteNote(id)
      toast.add({
        severity: 'success',
        summary: 'Excluído!',
        detail: 'Nota excluída com sucesso!',
        life: 3000
      })
      await refreshAll()
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error)
      notifyError(error, 'Erro ao excluir nota')
    }
  }
}

const handleTogglePin = async (id: number) => {
  const note = notes.value.find(n => n.id === id)
  if (note) {
    try {
      await api.updateNote({ ...note, isPinned: !note.isPinned })
      toast.add({
        severity: 'info',
        summary: 'Atualizado!',
        detail: note.isPinned ? 'Nota desfixada' : 'Nota fixada',
        life: 3000
      })
      await loadNotes()
    } catch (error: any) {
      console.error('Erro ao atualizar nota:', error)
      notifyError(error, 'Erro ao atualizar nota')
    }
  }
}

const saveNote = async (noteData: any) => {
  try {
    if (editingNote.value) {
      await api.updateNote({ ...noteData, id: editingNote.value.id })
      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Nota atualizada com sucesso!',
        life: 3000
      })
    } else {
      await api.createNote(noteData)
      toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Nota criada com sucesso!',
        life: 3000
      })
    }

    await refreshAll()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar nota:', error)
    notifyError(error, 'Erro ao salvar nota. Tente novamente.')
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const closeModal = () => {
  isModalOpen.value = false
  editingNote.value = null 
}

const handleToggleMobileMenu = () => {
  if (sidebarRef.value?.openMenu) {
    sidebarRef.value.openMenu()
  }
}

onMounted(async () => {
  await Promise.all([loadNotes(), loadFolders(), loadTags()])
  window.addEventListener('toggle-mobile-menu', handleToggleMobileMenu)
})

onUnmounted(() => {
  window.removeEventListener('toggle-mobile-menu', handleToggleMobileMenu)
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 73px);
  position: relative;
}

.content {
  flex: 1;
  margin-left: 280px; 
  padding: 24px 24px;
  overflow-y: auto;
  background: var(--bg-primary);
  min-height: calc(100vh - 73px);
}

.workspace-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.workspace-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.active-filter {
  background: #2563eb;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  animation: fadeIn var(--transition-fast);
}

.clear-filter {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 11px;
  transition: background var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clear-filter .pi-times {
  font-size: 12px;
}

.clear-filter:hover {
  background: rgba(255, 255, 255, 0.4);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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
  padding: 60px 20px;
  animation: fadeIn var(--transition-normal);
}

.empty-state h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-state h2 .pi-file-edit {
  font-size: 24px;
  color: var(--accent-text);
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state h2 .pi-search,
.empty-state h2 .pi-filter-slash {
  font-size: 24px;
  color: var(--accent-text);
}

.empty-action {
  margin-top: 16px;
  min-height: 44px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.empty-action:hover {
  background: var(--hover-bg);
}

.content:focus {
  outline: none;
}

.notes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet */
@media (min-width: 641px) {
  .notes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .content {
    padding: 32px 32px;
  }
  
  .notes-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

/* Large Desktop */
@media (min-width: 1400px) {
  .notes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Mobile - sidebar escondida */
@media (max-width: 768px) {
  .content {
    margin-left: 0;
    padding: 16px 16px;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .content {
    margin-left: 0;
    padding: 16px 16px;
  }
}
</style>