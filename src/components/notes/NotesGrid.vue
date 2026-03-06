<template>
  <div v-if="filteredNotes.length === 0" class="empty">
    <p>Nenhuma nota encontrada</p>
  </div>
  
  <div v-else class="grid">
    <NoteCard 
      v-for="note in filteredNotes" 
      :key="note.id" 
      :note="note"
      @edit="$emit('edit', note)"
      @delete="$emit('delete', note.id)"
      @togglePin="$emit('togglePin', note.id)"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import NoteCard from './NoteCard.vue'

// Defina as props
defineProps({
  notes: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedFolder: {
    type: String,
    default: null
  },
  selectedTag: {
    type: String,
    default: null
  }
})

// Defina os emits
defineEmits(['edit', 'delete', 'togglePin'])

// Crie um computed para filtrar as notas
const filteredNotes = computed(() => {
  if (!selectedFolder && !selectedTag) {
    return notes.value
  }

  return notes.value.filter(note => {
    if (selectedFolder && note.folder !== selectedFolder) {
      return false
    }

    if (selectedTag && !note.tags.includes(selectedTag)) {
      return false
    }

    return true
  })
})
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>