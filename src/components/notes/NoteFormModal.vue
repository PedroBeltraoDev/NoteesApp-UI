<template>
  <PDialog 
    v-model:visible="modalVisible" 
    :header="note ? 'Editar Nota' : 'Nova Nota'"
    :modal="true"
    :breakpoints="{ '768px': '95vw' }"
    :style="{ width: '600px' }"
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="true"
    class="note-modal"
  >
    <div class="modal-content">
      <!-- Título -->
      <div class="form-group">
        <label for="title" class="form-label">
          Título *
          <span class="char-count">{{ title.length }}/200</span>
        </label>
        <PInputText
          id="title"
          v-model="title"
          placeholder="Digite o título da nota"
          :class="{ 'p-invalid': errors.title }"
          maxlength="200"
          class="w-full"
        />
        <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
      </div>
      
      <!-- Conteúdo -->
      <div class="form-group">
        <label for="content" class="form-label">
          Conteúdo *
          <span class="char-count">{{ content.length }}/1000</span>
        </label>
        <Textarea
          id="content"
          v-model="content"
          @input="clearContentError"  
          placeholder="Digite o conteúdo da nota"
          :class="['w-full', { 'p-invalid': errors.content }]"
          maxlength="1000"
          rows="6"
          autoResize
        />
        <small v-if="errors.content" class="p-error">{{ errors.content }}</small>
      </div>
      
      <!-- Pasta e Tags -->
      <div class="form-row">
        <div class="form-group">
          <label for="folder" class="form-label">Pasta (opcional)</label>
          <PSelect
            v-model="folder"
            :options="folderOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione uma pasta"
            class="w-full"
          />
        </div>
        
        <div class="form-group">
          <label for="tags" class="form-label">Tags (separadas por vírgula)</label>
          <PInputText
            id="tags"
            v-model="tags"
            placeholder="ex: vue, typescript, api"
            class="w-full"
          />
        </div>
      </div>
    </div>
    
    <!-- Footer com Botões -->
    <template #footer>
      <PButton 
        label="Cancelar" 
        severity="secondary" 
        @click="handleCancel"
        outlined
      />
      <PButton 
        label="Salvar" 
        severity="success" 
        @click="handleSubmit"
        :loading="saving"
      />
    </template>
  </PDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  note: any | null
}>()

const emit = defineEmits(['close', 'saved'])

const modalVisible = ref(false)
const title = ref('')
const content = ref('')
const folder = ref('')
const tags = ref('')
const errors = ref<any>({})
const saving = ref(false)

// Opções de pasta
const folderOptions = [
  { label: 'Nenhuma', value: '' },
  { label: 'Aprendendo', value: 'Aprendendo' },
  { label: 'Projetos', value: 'Projetos' },
  { label: 'Pessoal', value: 'Pessoal' },
  { label: 'Trabalho', value: 'Trabalho' },
  { label: 'Ideias', value: 'Ideias' }
]

// Resetar formulário
const resetForm = () => {
  title.value = ''
  content.value = ''
  folder.value = ''
  tags.value = ''
  errors.value = {}
  saving.value = false
}

// Watch para sincronizar isOpen com modalVisible
watch(() => props.isOpen, (newValue) => {
  modalVisible.value = newValue
  if (newValue) {
    if (props.note) {
      // Modo edição
      title.value = props.note.title || ''
      content.value = props.note.content || ''
      folder.value = props.note.folder || ''
      tags.value = props.note.tags?.join(', ') || ''
    } else {
      // Modo criação
      resetForm()
    }
  }
}, { immediate: true })

watch(modalVisible, (newValue) => {
  if (!newValue) {
    emit('close')
    resetForm()
  }
})

const validateForm = () => {
  errors.value = {}
  
  // Título
  if (!title.value || title.value.trim().length < 3) {
    errors.value.title = 'Título deve ter pelo menos 3 caracteres'
  } else if (title.value.length > 200) {
    errors.value.title = 'Título deve ter no máximo 200 caracteres'
  }
  
  // Conteúdo - VERIFICAR SE ESTÁ VAZIO OU MUITO CURTO
  if (!content.value || content.value.trim().length === 0) {
    errors.value.content = 'Conteúdo é obrigatório'
  } else if (content.value.trim().length < 10) {
    errors.value.content = 'Conteúdo deve ter pelo menos 10 caracteres'
  } else if (content.value.length > 1000) {
    errors.value.content = 'Conteúdo deve ter no máximo 1000 caracteres'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return
  
  saving.value = true
  
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
  
  saving.value = false
}

const handleCancel = () => {
  modalVisible.value = false
}

const clearContentError = () => {
  if (errors.value.content && content.value && content.value.trim().length >= 10) {
    errors.value.content = ''
  }
}
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.char-count {
  font-weight: 400;
  color: var(--text-tertiary);
  float: right;
  font-size: 0.75rem;
}

.w-full {
  width: 100%;
}

:deep(.p-dialog) {
  background: var(--bg-secondary);
}

:deep(.p-dialog-header) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.p-dialog-content) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

:deep(.p-inputtext) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.p-inputtext:focus) {
  border-color: var(--accent-color);
}

:deep(.p-select) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.p-error) {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
:deep(.p-textarea),
:deep(.custom-textarea),
:deep(.custom-textarea-input) {
  background: var(--bg-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  color: var(--text-primary) !important;
  font-size: 14px !important;
  padding: 0.75rem !important;
  width: 100% !important;
  min-height: 120px !important;
  resize: vertical !important;
  font-family: inherit !important;
  transition: border-color 0.2s !important;
}

:deep(.p-textarea):focus,
:deep(.custom-textarea):focus,
:deep(.custom-textarea-input):focus {
  border-color: var(--accent-color) !important;
  outline: none !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

:deep(.p-textarea)::placeholder,
:deep(.custom-textarea)::placeholder {
  color: var(--text-tertiary) !important;
}

:deep(.p-invalid) {
  border-color: #dc2626 !important;
}

:deep(.p-dialog-content) {
  max-height: 70vh !important;
  overflow-y: auto !important;
}
:deep(.p-textarea) {
  background: var(--bg-primary) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  font-family: inherit !important;
  font-size: 14px !important;
  padding: 0.75rem !important;
  min-height: 120px !important;
  resize: vertical !important;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

:deep(.p-textarea):focus {
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 0 3px var(--accent-glow) !important;
  outline: none !important;
}

:deep(.p-textarea)::placeholder {
  color: var(--text-tertiary) !important;
}

:deep(.p-invalid) {
  border-color: #dc2626 !important;
}

:deep(.p-error) {
  color: #dc2626 !important;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

/* Ajustar altura do modal */
:deep(.p-dialog-content) {
  max-height: 70vh !important;
  overflow-y: auto !important;
}
</style>