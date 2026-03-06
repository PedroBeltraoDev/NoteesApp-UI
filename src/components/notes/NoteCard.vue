<template>
  <div class="note-card" :class="{ pinned: note.isPinned }" @click="openFullNote">
    <div class="note-header" @click.stop>
      <h3 class="note-title">{{ note.title }}</h3>
      <span v-if="note.isPinned" class="pin-badge">📌 Fixada</span>
    </div>
    
    <p class="note-content" :title="note.content">
      {{ truncatedContent }}
      <span v-if="note.content.length > 150" class="read-more">...</span>
    </p>
    
    <div v-if="note.tags && note.tags.length > 0" class="note-tags" @click.stop>
      <span v-for="tag in note.tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
    
    <div class="note-footer" @click.stop>
      <span class="note-date">{{ formatDate(note.createdAt) }}</span>
      <div class="note-actions">
        <button @click="$emit('edit', note)" class="action-btn" title="Editar">
          ✏️ Editar
        </button>
        <button @click="$emit('togglePin', note.id)" class="action-btn" :title="note.isPinned ? 'Desfixar' : 'Fixar'">
          {{ note.isPinned ? '📌 Desfixar' : '📌 Fixar' }}
        </button>
        <button @click="$emit('delete', note.id)" class="action-btn delete" title="Excluir">
          🗑️ Excluir
        </button>
      </div>
    </div>
  </div>
  
  <!-- Modal de Visualização Completa -->
  <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-full" @click.stop>
      <div class="modal-header">
        <h2>{{ note.title }}</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="note-full-content">
          <p>{{ note.content }}</p>
        </div>
        <div v-if="note.tags && note.tags.length > 0" class="note-full-tags">
          <span v-for="tag in note.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
        <div class="note-full-footer">
          <span class="note-date">{{ formatDate(note.createdAt) }}</span>
          <span v-if="note.folder" class="note-folder">📁 {{ note.folder }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  note: {
    id: number
    title: string
    content: string
    createdAt: string
    tags?: string[]
    folder?: string
    isPinned: boolean
  }
}>()

defineEmits(['edit', 'delete', 'togglePin'])

const isModalOpen = ref(false)

// ✅ CORREÇÃO 1: Acessar props.note.content ao invés de props.content
const truncatedContent = computed(() => {
  if (props.note.content.length <= 150) {
    return props.note.content
  }
  return props.note.content.substring(0, 150)
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const openFullNote = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}
</script>

<style scoped>
.note-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  height: 280px;
  max-height: 280px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.note-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--text-tertiary);
}

.note-card.pinned {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.note-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  letter-spacing: -0.3px;
}

.pin-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.note-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4; /* ✅ CORREÇÃO 2: Adicionado para compatibilidade */
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.read-more {
  color: var(--accent-color);
  font-weight: 600;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-color);
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.note-date {
  font-size: 13px;
  color: var(--text-tertiary);
}

.note-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Modal Full Screen */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-full {
  background: var(--card-bg);
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-full .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--card-bg);
  z-index: 1;
}

.modal-full .modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-full .close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-full .close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-full .modal-body {
  padding: 24px;
}

.note-full-content {
  margin-bottom: 24px;
}

.note-full-content p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.note-full-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.note-full-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-tertiary);
}

.note-folder {
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 500;
}
</style>