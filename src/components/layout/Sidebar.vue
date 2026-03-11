<template>
  <aside :class="['sidebar', { 'sidebar-open': isOpen }]">
    <div class="sidebar-overlay" @click="closeSidebar"></div>
    
    <div class="sidebar-content">
      <div class="sidebar-header">
        <h2 class="sidebar-title">PASTAS</h2>
        <button @click="closeSidebar" class="close-mobile-btn">✕</button>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          v-for="folder in folders" 
          :key="folder"
          @click="selectFolder(folder)"
          :class="['nav-item', { active: selectedFolder === folder }]"
        >
          <span class="folder-icon">📁</span>
          {{ folder }}
        </button>
      </nav>
      
      <div class="sidebar-section">
        <h2 class="sidebar-title">TAGS</h2>
        <nav class="sidebar-nav">
          <button 
            v-for="tag in tags" 
            :key="tag"
            @click="selectTag(tag)"
            :class="['nav-item tag-item', { active: selectedTag === tag }]"
          >
            <span class="tag-icon">#</span>
            {{ tag }}
          </button>
        </nav>
        <p v-if="tags.length === 0" class="empty-tags">Nenhuma tag foi criada</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  folders: string[]
  tags: string[]
  selectedFolder: string | null
  selectedTag: string | null
}>()

const emit = defineEmits<{
  selectFolder: [folder: string]
  selectTag: [tag: string]
  clearFilters: []
  'update:mobileOpen': [value: boolean]
}>()

const isOpen = ref(false)

const selectFolder = (folder: string) => {
  emit('selectFolder', folder)
  isOpen.value = false
}

const selectTag = (tag: string) => {
  emit('selectTag', tag)
  isOpen.value = false
}

const closeSidebar = () => {
  isOpen.value = false
  emit('update:mobileOpen', false)
}

watch(() => [props.selectedFolder, props.selectedTag], () => {
  if (window.innerWidth < 768) {
    isOpen.value = false
  }
})

defineExpose({
  openMenu: () => {
    isOpen.value = true
    emit('update:mobileOpen', true)
  }
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 280px;
  height: 100vh; /* ✅ Altura total da viewport */
  min-height: 100vh; /* ✅ Garante altura mínima */
  background: var(--bg-secondary);
  z-index: 1000;
  transition: left 0.3s ease;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.sidebar-open {
  left: 0;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.sidebar-open .sidebar-overlay {
  display: block;
}

.sidebar-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.close-mobile-btn {
  display: block;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-mobile-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-color);
  color: white;
}

.folder-icon,
.tag-icon {
  font-size: 16px;
}

.tag-item {
  font-size: 13px;
}

.empty-tags {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
}

.sidebar-section {
  margin-top: 32px;
}

@media (min-width: 769px) {
  .sidebar {
    position: relative;
    left: 0;
    width: 260px;
    min-width: 260px;
    height: calc(100vh - 73px); 
    min-height: calc(100vh - 73px);
    box-shadow: none;
  }
  
  .sidebar-overlay {
    display: none !important;
  }
  
  .close-mobile-btn {
    display: none !important;
  }
  
  .sidebar-content {
    padding: 24px 16px;
    height: auto;
  }
}
</style>