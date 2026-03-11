<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleCancel">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ note ? 'Editar Nota' : 'Nova Nota' }}</h2>
        <button @click="handleCancel" class="close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label for="title">
            Título *
            <span class="char-count">{{ title.length }}/200</span>
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Digite o título da nota"
            :class="{ error: errors.title }"
            maxlength="200"
          />
          <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
        </div>
        
        <div class="form-group">
          <label for="content">
            Conteúdo *
            <span class="char-count">{{ content.length }}/1000</span>
          </label>
          <textarea
            id="content"
            v-model="content"
            placeholder="Digite o conteúdo da nota"
            :class="{ error: errors.content }"
            maxlength="1000"
            rows="6"
          ></textarea>
          <span v-if="errors.content" class="error-message">{{ errors.content }}</span>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="folder">Pasta (opcional)</label>
            <select id="folder" v-model="folder" class="select-field">
              <option value="">Nenhuma</option>
              <option value="Aprendendo">Aprendendo</option>
              <option value="Projetos">Projetos</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Trabalho">Trabalho</option>
              <option value="Ideias">Ideias</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="tags">Tags (separadas por vírgula)</label>
            <input
              id="tags"
              v-model="tags"
              type="text"
              placeholder="ex: vue, typescript, api"
            />
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="handleCancel" class="btn-cancel">Cancelar</button>
        <button @click="handleSubmit" class="btn-save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  note: any | null
}>()

const emit = defineEmits(['close', 'saved'])

const title = ref('')
const content = ref('')
const folder = ref('')
const tags = ref('')
const errors = ref<any>({})

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (props.note) {
      title.value = props.note.title || ''
      content.value = props.note.content || ''
      folder.value = props.note.folder || ''
      tags.value = props.note.tags?.join(', ') || ''
    } else {
      resetForm()
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  title.value = ''
  content.value = ''
  folder.value = ''
  tags.value = ''
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  
  if (!title.value.trim()) {
    errors.value.title = 'Título é obrigatório'
  } else if (title.value.length < 3) {
    errors.value.title = 'Título deve ter pelo menos 3 caracteres'
  } else if (title.value.length > 200) {
    errors.value.title = 'Título deve ter no máximo 200 caracteres'
  }
  
  if (!content.value.trim()) {
    errors.value.content = 'Conteúdo é obrigatório'
  } else if (content.value.length < 10) {
    errors.value.content = 'Conteúdo deve ter pelo menos 10 caracteres'
  } else if (content.value.length > 1000) {
    errors.value.content = 'Conteúdo deve ter no máximo 1000 caracteres'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  const tagsArray = tags.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
  
  emit('saved', {
    title: title.value.trim(),
    content: content.value.trim(),
    folder: folder.value.trim() || null,
    tags: tagsArray,
    isPinned: false
  })
}

const handleCancel = () => {
  emit('close')
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
  align-items: flex-end;
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
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
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
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--card-bg);
  z-index: 1;
}

.modal-header h2 {
  font-size: 18px;
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
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
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
  padding: 12px 14px;
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
  min-height: 120px;
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
  padding: 20px;
  border-top: 1px solid var(--border-color);
  position: sticky;
  bottom: 0;
  background: var(--card-bg);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  padding: 12px 20px;
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
  padding: 12px 20px;
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

/* Desktop */
@media (min-width: 641px) {
  .modal-overlay {
    align-items: center;
  }
  
  .modal {
    border-radius: 16px;
    max-width: 600px;
    max-height: 90vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .form-row {
    flex-direction: row;
  }
}

@media (min-width: 769px) {
  .modal-header h2 {
    font-size: 20px;
  }
  
  .modal-body {
    padding: 24px;
  }
}
</style>