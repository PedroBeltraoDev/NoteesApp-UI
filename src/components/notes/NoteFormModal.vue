<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Editar Nota' : 'Nova Nota' }}</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Título * <span class="char-count">{{ titleCharCount }}/200</span></label>
          <input 
            v-model="localTitle" 
            type="text" 
            placeholder="Título da nota..."
            class="input-field"
            :class="{ error: errors.title || isTitleLimitExceeded }"
          />
          <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
          <span v-if="isTitleLimitExceeded" class="error-message">Limite de 200 caracteres excedido</span>
        </div>
        
        <div class="form-group">
          <label>Conteúdo * <span class="char-count">{{ contentCharCount }}/1000</span></label>
          <textarea 
            v-model="localContent" 
            placeholder="Escreva sua nota..."
            rows="6"
            class="textarea-field"
            :class="{ error: errors.content || isContentLimitExceeded }"
          ></textarea>
          <span v-if="errors.content" class="error-message">{{ errors.content }}</span>
          <span v-if="isContentLimitExceeded" class="error-message">Limite de 1000 caracteres excedido</span>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Pasta (opcional)</label>
            <select v-model="localFolder" class="select-field">
              <option value="">Nenhuma</option>
              <option value="Projects">Projetos</option>
              <option value="Personal">Pessoal</option>
              <option value="Learning">Aprendizado</option>
              <option value="Travel">Viagens</option>
              <option value="Archives">Arquivos</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Tags (separadas por vírgula)</label>
            <input 
              v-model="localTags" 
              type="text" 
              placeholder="#Trabalho, #Ideia"
              class="input-field"
            />
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn-cancel">Cancelar</button>
        <button @click="handleSubmit" class="btn-save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  note: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const localTitle = ref('')
const localContent = ref('')
const localFolder = ref('')
const localTags = ref('')

const errors = ref({ title: '', content: '' })

const isEditing = computed(() => !!props.note?.id)
const contentCharCount = computed(() => localContent.value.length)
const titleCharCount = computed(() => localTitle.value.length)
const isContentLimitExceeded = computed(() => contentCharCount.value > 1000)
const isTitleLimitExceeded = computed(() => titleCharCount.value > 200)

watch(() => props.note, (newNote: any) => {
  if (newNote) {
    localTitle.value = newNote.title ?? ''
    localContent.value = newNote.content ?? ''
    localFolder.value = newNote.folder ?? ''
    localTags.value = newNote.tags?.join(', ') ?? ''
  } else {
    localTitle.value = ''
    localContent.value = ''
    localFolder.value = ''
    localTags.value = ''
  }
  errors.value = { title: '', content: '' }
}, { immediate: true })

const closeModal = () => {
  errors.value = { title: '', content: '' }
  emit('close')
}

const validateForm = () => {
  let isValid = true
  errors.value = { title: '', content: '' }
  
  if (!localTitle.value.trim()) {
    errors.value.title = 'Título é obrigatório'
    isValid = false
  } else if (localTitle.value.trim().length < 3) {
    errors.value.title = 'Título deve ter pelo menos 3 caracteres'
    isValid = false
  } else if (localTitle.value.trim().length > 200) {
    errors.value.title = 'Título deve ter no máximo 200 caracteres'
    isValid = false
  }
  
  if (!localContent.value.trim()) {
    errors.value.content = 'Conteúdo é obrigatório'
    isValid = false
  } else if (localContent.value.trim().length < 10) {
    errors.value.content = 'Conteúdo deve ter pelo menos 10 caracteres'
    isValid = false
  } else if (localContent.value.trim().length > 1000) {
    errors.value.content = 'Conteúdo deve ter no máximo 1000 caracteres'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }
  
  const tagsArray = localTags.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
  
  const noteData: any = {
  title: localTitle.value.trim(),
  content: localContent.value.trim(),
  tags: tagsArray,
  folder: localFolder.value || null
}

if (isEditing.value && props.note) {
  noteData.id = props.note.id  
  noteData.createdAt = props.note.createdAt  
}
  
  emit('saved', noteData)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--card-bg);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
  float: right;
}

.input-field,
.textarea-field,
.select-field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: all 0.2s;
}

.input-field.error,
.textarea-field.error {
  border-color: #dc2626;
}

.input-field:focus,
.textarea-field:focus,
.select-field:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.textarea-field {
  resize: vertical;
  font-family: inherit;
}

.error-message {
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--border-color);
}

.btn-save {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  background: var(--accent-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>