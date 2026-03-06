<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h3 class="section-title">Pastas</h3>
      <ul class="sidebar-list">
        <li 
          v-for="folder in folders" 
          :key="folder"
          class="sidebar-item"
          :class="{ active: selectedFolder === folder }"
          @click="selectFolder(folder)"
        >
          {{ folder }}
        </li>
      </ul>
    </div>
    
    <div class="sidebar-section">
      <h3 class="section-title">Tags</h3>
      <ul v-if="tags.length > 0" class="sidebar-list">
        <li 
          v-for="tag in tags" 
          :key="tag"
          class="sidebar-item"
          :class="{ active: selectedTag === tag }"
          @click="selectTag(tag)"
        >
          {{ tag }}
        </li>
      </ul>
      <p v-else class="no-tags-message">Nenhuma tag foi criada</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const folders = ref<string[]>(['Projects', 'Personal', 'Learning', 'Travel', 'Archives'])
const tags = ref<string[]>([])
const selectedFolder = ref<string | null>(null)
const selectedTag = ref<string | null>(null)

const emit = defineEmits(['selectFolder', 'selectTag', 'clearFilters'])

const selectFolder = (folder: string) => {
  if (selectedFolder.value === folder) {
    selectedFolder.value = null
    emit('clearFilters')
  } else {
    selectedFolder.value = folder
    selectedTag.value = null
    emit('selectFolder', folder)
  }
}

const selectTag = (tag: string) => {
  if (selectedTag.value === tag) {
    selectedTag.value = null
    emit('clearFilters')
  } else {
    selectedTag.value = tag
    selectedFolder.value = null
    emit('selectTag', tag)
  }
}

onMounted(async () => {
  try {
    const [foldersRes, tagsRes] = await Promise.all([
      fetch('http://localhost:5216/api/notes/folders'),
      fetch('http://localhost:5216/api/notes/tags')
    ])
    
    if (foldersRes.ok) {
      folders.value = await foldersRes.json()
    }
    
    if (tagsRes.ok) {
      const fetchedTags = await tagsRes.json()
      tags.value = fetchedTags.length > 0 ? fetchedTags : []
    }
  } catch (error) {
    console.error('Erro ao carregar pastas/tags:', error)
  }
})
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 32px 24px;
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--sidebar-text);
  margin: 0 0 16px 0;
  padding-left: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.no-tags-message {
  color: var(--sidebar-text);
  font-size: 14px;
  padding-left: 12px;
  font-style: italic;
}

.sidebar-item {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  font-weight: 500;
}

.sidebar-item:hover {
  background: var(--hover-sidebar-item);
  color: var(--topbar-text);
}

.sidebar-item.active {
  background: var(--sidebar-active);
  color: white;
  font-weight: 600;
}
</style>