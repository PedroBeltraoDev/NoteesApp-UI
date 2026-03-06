<template>
  <div class="dashboard">
    <Topbar @search="handleSearch" @createNote="handleCreateNote" />
    
    <div class="main-container">
      <Sidebar 
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
import { ref, onMounted, computed } from 'vue'
import Topbar from '../components/layout/Topbar.vue'
import Sidebar from '../components/layout/Sidebar.vue'
import NoteCard from '../components/notes/NoteCard.vue'
import NoteFormModal from '../components/notes/NoteFormModal.vue'

const API_BASE_URL = 'https://noteesapp-be.onrender.com/api'

const notes = ref<any[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const editingNote = ref<any>(null)
const searchQuery = ref('')
const selectedFolder = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const currentSort = ref('all')

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

const fetchNotes = async (folder: string | null = null, tag: string | null = null) => {
  try {
    isLoading.value = true
    let url = `${API_BASE_URL}/notes`
    
    const params = new URLSearchParams()
    if (folder) params.append('folder', folder)
    if (tag) params.append('tag', tag)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Falha ao buscar notas')
    
    notes.value = await response.json()
  } catch (error: any) {
    console.error('Erro ao buscar notas:', error)
    notes.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchNotes()
})

const setSort = (sortType: string) => {
  currentSort.value = sortType
}

const selectFolder = (folder: string) => {
  selectedFolder.value = folder
  selectedTag.value = null
  fetchNotes(folder, null)
}

const selectTag = (tag: string) => {
  selectedTag.value = tag
  selectedFolder.value = null
  fetchNotes(null, tag)
}

const clearFilters = () => {
  selectedFolder.value = null
  selectedTag.value = null
  fetchNotes()
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
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Falha ao excluir nota')
      await fetchNotes(selectedFolder.value, selectedTag.value)
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
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, isPinned: !note.isPinned })
      })
      if (!response.ok) throw new Error('Falha ao atualizar nota')
      await fetchNotes(selectedFolder.value, selectedTag.value)
    } catch (error: any) {
      console.error('Erro ao atualizar nota:', error)
    }
  }
}

const saveNote = async (noteData: any) => {
  try {
    const url = editingNote.value 
      ? `${API_BASE_URL}/notes/${editingNote.value.id}`
      : `${API_BASE_URL}/notes`
    
    const method = editingNote.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao salvar nota')
    }
    
    await fetchNotes(selectedFolder.value, selectedTag.value)
    closeModal()
  } catch (error: any) {
    console.error('Erro ao salvar nota:', error)
    alert(error.message || 'Erro ao salvar nota. Tente novamente.')
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
  if (query.trim() === '') {
    fetchNotes(selectedFolder.value, selectedTag.value)
  } else {
    fetch(`${API_BASE_URL}/notes/search?query=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(filtered => {
        notes.value = filtered
      })
      .catch((error: any) => {
        console.error('Erro na busca:', error)
      })
  }
}

const closeModal = () => {
  isModalOpen.value = false
  editingNote.value = null
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-primary);
}

.main-container {
  display: flex;
  height: calc(100vh - 64px);
}

.content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-left {
  display: flex;
  align-items: center;
}

.workspace-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.active-filter {
  background: var(--accent-color);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  font-weight: 500;
}

.clear-filter {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
}

.filters {
  display: flex;
  gap: 12px;
}

.filter-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
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
  height: 400px;
  color: var(--text-secondary);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state h2 {
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 600;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-secondary);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}
</style>