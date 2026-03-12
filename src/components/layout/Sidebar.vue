<template>
  <aside v-if="!isMobile" class="sidebar-desktop">
    <div class="sidebar-content">
      <!-- Pastas -->
      <div class="sidebar-section">
        <h2 class="sidebar-title">PASTAS</h2>
        <nav class="sidebar-nav">
          <button 
            v-for="folder in folders" 
            :key="folder"
            @click="selectFolder(folder)"
            :class="['nav-item', { active: selectedFolder === folder }]"
          >
            <i class="pi pi-folder folder-icon"></i>
            {{ folder }}
          </button>
        </nav>
      </div>

      <!-- Tags -->
      <div class="sidebar-section">
        <h2 class="sidebar-title">TAGS</h2>
        <nav class="sidebar-nav" v-if="tags && tags.length > 0">
          <button 
            v-for="tag in tags" 
            :key="tag"
            @click="selectTag(tag)"
            :class="['nav-item tag-item', { active: selectedTag === tag }]"
          >
            <i class="pi pi-hashtag tag-icon"></i>
            {{ tag }}
          </button>
        </nav>
        <p v-else class="empty-tags">Nenhuma tag encontrada</p>
      </div>
    </div>
  </aside>
  
  <!-- Mobile: Drawer com Overlay -->
  <PDrawer 
    v-else
    v-model:visible="isOpen" 
    :modal="true"
    :fullScreen="false"
    position="left"
    class="mobile-drawer"
    :pt="{
      root: { 
        class: 'no-scrollbar',
        style: { 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        } 
      },
      content: { 
        class: 'no-scrollbar',
        style: { 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overflowY: 'scroll'
        } 
      }
    }"
  >
    <template #header>
      <div class="sidebar-header">
        <h2 class="sidebar-title">PASTAS</h2>
      </div>
    </template>
    
    <div class="sidebar-content">
      <!-- Pastas -->
      <div class="sidebar-section">
        <nav class="sidebar-nav">
          <button 
            v-for="folder in folders" 
            :key="folder"
            @click="selectFolder(folder)"
            :class="['nav-item', { active: selectedFolder === folder }]"
          >
            <i class="pi pi-folder folder-icon"></i>
            {{ folder }}
          </button>
        </nav>
      </div>
      
      <Divider />
      
      <!-- Tags -->
      <div class="sidebar-section">
        <h2 class="sidebar-title">TAGS</h2>
        <nav class="sidebar-nav" v-if="tags && tags.length > 0">
          <button 
            v-for="tag in tags" 
            :key="tag"
            @click="selectTag(tag)"
            :class="['nav-item tag-item', { active: selectedTag === tag }]"
          >
            <i class="pi pi-hashtag tag-icon"></i>
            {{ tag }}
          </button>
        </nav>
        <p v-else class="empty-tags">Nenhuma tag encontrada</p>
      </div>
    </div>
  </PDrawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

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
const isMobile = ref(window.innerWidth < 768)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const selectFolder = (folder: string) => {
  emit('selectFolder', folder)
  if (isMobile.value) {
    isOpen.value = false
  }
}

const selectTag = (tag: string) => {
  emit('selectTag', tag)
  if (isMobile.value) {
    isOpen.value = false
  }
}

const closeSidebar = () => {
  isOpen.value = false
  emit('update:mobileOpen', false)
}

watch(() => [props.selectedFolder, props.selectedTag], () => {
  if (isMobile.value) {
    isOpen.value = false
  }
})

onMounted(() => {
  window.addEventListener('resize', checkMobile)
  checkMobile()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

defineExpose({
  openMenu: () => {
    isOpen.value = true
    emit('update:mobileOpen', true)
  }
})
</script>

<style scoped>
/* DESKTOP */
.sidebar-desktop {
  width: 280px;
  min-width: 280px;
  height: calc(100vh - 73px);
  background: var(--bg-secondary);
  overflow-y: auto;
  overflow-x: hidden;
  border: none !important;
  box-shadow: none !important;
  
  /* Posicionamento */
  position: fixed;
  left: 0;
  top: 93px;
  bottom: 0;
  z-index: 40;
  
  /* Scrollbar invisível */
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.sidebar-desktop::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  display: none !important;
}

.sidebar-desktop::-webkit-scrollbar-track,
.sidebar-desktop::-webkit-scrollbar-thumb,
.sidebar-desktop::-webkit-scrollbar-corner {
  display: none !important;
  background: transparent !important;
}

.sidebar-content {
  padding: 1rem 0;
}

.sidebar-section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.sidebar-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  opacity: 0.9;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: translateX(4px);
}

.nav-item:active {
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--accent-color);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.folder-icon,
.tag-icon {
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.nav-item:hover .folder-icon,
.nav-item:hover .tag-icon {
  transform: scale(1.1);
}

.tag-item {
  font-size: 0.8125rem;
}

.empty-tags {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  font-style: italic;
  padding: 0.5rem 1rem;
}

:deep(.p-divider) {
  border-color: var(--border-color) !important;
  margin: 1rem 0 !important;
  opacity: 0.6;
}

/* ============================================
   MOBILE: Drawer
   ============================================ */
.mobile-drawer :deep(.p-drawer) {
  background: var(--bg-secondary) !important;
  border: none !important;
  box-shadow: none !important;
  width: 280px !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.mobile-drawer :deep(.p-drawer::-webkit-scrollbar),
.mobile-drawer :deep(.p-drawer-content::-webkit-scrollbar) {
  display: none !important;
  width: 0 !important;
}

.mobile-drawer :deep(.p-drawer-header) {
  display: none !important;
}

.mobile-drawer :deep(.p-drawer-content) {
  background: var(--bg-secondary) !important;
  padding: 0;
  scrollbar-width: none !important;
}

/* ============================================
   RESPONSIVIDADE
   ============================================ */
@media (max-width: 1024px) {
  .sidebar-desktop {
    width: 240px;
    min-width: 240px;
  }
}

@media (max-width: 768px) {
  .sidebar-desktop {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .sidebar-title {
    font-size: 0.6875rem;
  }
  .nav-item {
    font-size: 0.8125rem;
    padding: 0.75rem 1rem;
  }
}
</style>