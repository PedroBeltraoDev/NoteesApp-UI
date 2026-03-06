<template>
  <div class="dashboard">
    <Topbar @search="handleSearch" @createNote="handleCreateNote" />
    
    <div class="main-container">
      <Sidebar 
        ref="sidebarRef"
        :folders="folders"
        :tags="tags"
        :selectedFolder="selectedFolder"
        :selectedTag="selectedTag"
        @selectFolder="selectFolder" 
        @selectTag="selectTag"
        @clearFilters="clearFilters"
      />
      
      <main class="content">
        <div class="workspace-header">
          <div class="header-left">
            <h2 class="workspace-title">Minha Área de Trabalho</h2>
            <span v-if="activeFilter" class="active-filter">
              Filtrando por: {{ activeFilter }}
              <button @click="clearFilters" class="clear-filter">✕</button>
            </span>
          </div>
          <div class="filters">
            <button 
              class="filter-btn" 
              :class="{ active: currentSort === 'all' }"
              @click="setSort('all')"
            >
              Todas as Notas
            </button>
            <button 
              class="filter-btn"
              :class="{ active: currentSort === 'recent' }"
              @click="setSort('recent')"
            >
              Recentes
            </button>
            <button 
              class="filter-btn"
              :class="{ active: currentSort === 'tags' }"
              @click="setSort('tags')"
            >
              Tags
            </button>
            <button 
              class="filter-btn"
              :class="{ active: currentSort === 'date' }"
              @click="setSort('date')"
            >
              Por Data
            </button>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>Carregando notas...</p>
        </div>
        
        <div v-else-if="notes.length === 0" class="empty-state">
          <h2>📝 Nenhuma nota ainda</h2>
          <p>Clique em "Nova Nota" para criar sua primeira nota!</p>
        </div>
        
        <div v-else class="notes-grid">
          <NoteCard 
            v-for="note in sortedNotes" 
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
const currentSort = ref('all')
const sidebarRef = ref<any>(null)

// COMPUTED
const activeFilter = computed(() => {
  if (selectedFolder.value) return `Pasta: ${selectedFolder.value}`
  if (selectedTag.value) return `Tag: ${selectedTag.value}`
  return null
})

const sortedNotes = computed(() => {
  let sorted = [...notes.value]
  
  switch (currentSort.value) {
    case 'recent':
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      sorted = sorted.filter(n => new Date(n.createdAt).getTime() > weekAgo.getTime())
      break
    
    case 'tags':
      sorted = sorted.filter(n => n.tags && n.tags.length > 0)
      break
    
    case 'date':
      sorted.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      break
    
    case 'all':
    default:
      sorted.sort((a: any, b: any) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }
  
  return sorted
})

// FUNÇÕES DE CARREGAMENTO
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
  } finally {
    isLoading.value = false
  }
}

const loadFolders = async () => {
  try {
    folders.value = await api.getFolders()
  } catch (error) {
    console.error('Erro ao buscar pastas:', error)
  }
}

const loadTags = async () => {
  try {
    tags.value = await api.getTags()
  } catch (error) {
    console.error('Erro ao buscar tags:', error)
  }
}

// FUNÇÕES DE AÇÃO
const setSort = (sortType: string) => {
  currentSort.value = sortType
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
      await loadNotes()
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error)
      alert('Erro ao excluir nota')
    }
  }
}

const handleTogglePin = async (id: number) => {
  const note = notes.value.find(n => n.id === id)
  if (note) {
    try {
      await api.updateNote({ ...note, isPinned: !note.isPinned })
      await loadNotes()
    } catch (error: any) {
      console.error('Erro ao atualizar nota:', error)
    }
  }
}

const saveNote = async (noteData: any) => {
  try {
    if (editingNote.value) {
      await api.updateNote({ ...noteData, id: editingNote.value.id })
    } else {
      await api.createNote(noteData)
    }
    
    await loadNotes()
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar nota:', error)
    alert(error.message || 'Erro ao salvar nota. Tente novamente.')
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
  if (query.trim() === '') {
    loadNotes()
  } else {
    const filtered = notes.value.filter(n => 
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
    )
    notes.value = filtered
  }
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

// LIFECYCLE
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
}

.main-container {
  display: flex;
  min-height: calc(100vh - 73px);
}

.content {
  flex: 1;
  padding: 24px 16px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.workspace-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.workspace-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.active-filter {
  background: var(--accent-color);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
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
}

.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.filters::-webkit-scrollbar {
  height: 4px;
}

.filters::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.filter-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--bg-secondary);
  color: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
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
}

.empty-state h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
}

.notes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet */
@media (min-width: 641px) {
  .content {
    padding: 32px 24px;
  }
  
  .workspace-title {
    font-size: 28px;
  }
  
  .notes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .content {
    padding: 40px;
  }
  
  .workspace-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
  }
  
  .workspace-title {
    font-size: 32px;
  }
  
  .filters {
    overflow-x: visible;
    padding-bottom: 0;
  }
  
  .notes-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

/* Large Desktop */
@media (min-width: 1200px) {
  .notes-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>