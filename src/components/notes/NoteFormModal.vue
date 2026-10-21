<template>
  <PDialog
    :visible="modalVisible"
    :modal="true"
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="false"
    :breakpoints="{ '768px': '95vw' }"
    :style="{ width: '620px' }"
    :aria-labelledby="headingId"
    class="note-modal"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <div class="editor-head">
        <h2 :id="headingId" class="editor-title">{{ isEditing ? 'Editar nota' : 'Nova nota' }}</h2>
        <button
          type="button"
          class="fav-toggle"
          :class="{ active: isPinned }"
          :aria-pressed="isPinned"
          title="Marcar como favorita"
          @click="isPinned = !isPinned"
        >
          <i :class="isPinned ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
          Favorita
        </button>
      </div>
    </template>

    <div class="editor" @keydown.ctrl.enter.prevent="handleSubmit" @keydown.meta.enter.prevent="handleSubmit">
      <div class="field">
        <label for="note-title" class="field-label">Título</label>
        <input
          id="note-title"
          v-model="title"
          class="field-input"
          type="text"
          maxlength="200"
          autocomplete="off"
          placeholder="Do que se trata?"
          :autofocus="!isEditing"
          :aria-invalid="!!errors.title"
          :aria-describedby="errors.title ? 'note-title-error' : undefined"
          @input="errors.title = ''"
          @keydown.enter.prevent="focusContent"
        />
        <small v-if="errors.title" id="note-title-error" class="field-error" role="alert">{{ errors.title }}</small>
      </div>

      <div class="field">
        <label for="note-content" class="field-label">
          Anotação <span class="optional">(opcional)</span>
          <span v-if="content.length >= 800" class="counter" :class="{ limit: content.length >= 1000 }">
            {{ content.length }}/1000
          </span>
        </label>
        <textarea
          id="note-content"
          ref="contentInput"
          v-model="content"
          class="field-input"
          rows="5"
          maxlength="1000"
          placeholder="Escreva o que quiser guardar"
          :autofocus="isEditing"
          :aria-invalid="!!errors.content"
          :aria-describedby="errors.content ? 'note-content-error' : undefined"
          @input="errors.content = ''"
        ></textarea>
        <small v-if="errors.content" id="note-content-error" class="field-error" role="alert">{{ errors.content }}</small>
      </div>

      <div class="field" role="group" aria-labelledby="note-folder-label">
        <span id="note-folder-label" class="field-label">Pasta</span>
        <div class="choices">
          <button
            v-for="option in folderChoices"
            :key="option.value"
            type="button"
            class="choice"
            :class="{ active: folder === option.value }"
            :aria-pressed="folder === option.value"
            @click="selectFolder(option.value)"
          >
            <i :class="option.value ? 'pi pi-folder' : 'pi pi-inbox'" aria-hidden="true"></i>
            {{ option.label }}
          </button>

          <button v-if="!newFolderOpen" type="button" class="choice add" @click="openNewFolder">
            <i class="pi pi-plus" aria-hidden="true"></i> Nova pasta
          </button>
          <input
            v-else
            ref="newFolderInput"
            v-model="newFolderDraft"
            class="choice-input"
            type="text"
            maxlength="100"
            autocomplete="off"
            placeholder="Nome da pasta"
            aria-label="Nome da nova pasta"
            @keydown.enter.prevent="confirmNewFolder"
            @keydown.esc.stop.prevent="cancelNewFolder"
            @blur="confirmNewFolder"
          />
        </div>
        <small v-if="errors.folder" class="field-error" role="alert">{{ errors.folder }}</small>
      </div>

      <div class="field">
        <label for="note-tags" class="field-label">Tags</label>
        <div class="tag-box" @click="focusTagInput">
          <ul v-if="tagList.length > 0" class="chips" aria-label="Tags da nota">
            <li v-for="tag in tagList" :key="tag" class="chip">
              {{ tag }}
              <button type="button" class="chip-remove" :aria-label="`Remover a tag ${tag}`" @click.stop="removeTag(tag)">
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
          <input
            id="note-tags"
            ref="tagInput"
            v-model="tagDraft"
            class="tag-input"
            type="text"
            maxlength="50"
            autocomplete="off"
            placeholder="Digite e aperte Enter"
            :aria-describedby="errors.tags ? 'note-tags-error' : undefined"
            @keydown.enter.prevent="commitTagDraft"
            @keydown.backspace="onTagBackspace"
            @blur="commitTagDraft"
          />
        </div>
        <small v-if="errors.tags" id="note-tags-error" class="field-error" role="alert">{{ errors.tags }}</small>

        <div v-if="tagSuggestions.length > 0" class="suggestions">
          <span class="suggestions-label">Já usadas:</span>
          <button v-for="tag in tagSuggestions" :key="tag" type="button" class="chip suggestion" @click="addTag(tag)">
            <i class="pi pi-plus" aria-hidden="true"></i> {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="editor-foot">
        <button v-if="isEditing" type="button" class="btn btn-danger" @click="handleDelete">
          <i class="pi pi-trash" aria-hidden="true"></i> Excluir
        </button>

        <div v-if="confirmDiscard" class="foot-actions discard" role="alert">
          <span class="discard-text">Descartar o que você escreveu?</span>
          <button ref="keepEditingBtn" type="button" class="btn btn-ghost" @click="confirmDiscard = false">Continuar editando</button>
          <button type="button" class="btn btn-danger solid" @click="discard">Descartar</button>
        </div>
        <div v-else class="foot-actions">
          <button type="button" class="btn btn-ghost" @click="requestClose">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            title="Salvar (Ctrl+Enter)"
            :disabled="saving"
            @click="handleSubmit"
          >
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </template>
  </PDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { NoteInput } from '@/services/api'

interface EditableNote {
  id: number
  title: string
  content: string
  folder?: string | null
  tags?: string[]
  isPinned: boolean
}

const MAX_TAGS = 20

const props = defineProps<{
  isOpen: boolean
  note: EditableNote | null
  // Pastas e tags que o usuário já tem (vêm da API)
  folders?: string[]
  tags?: string[]
  // Ao criar: a pasta/tag que o usuário está filtrando já vem preenchida
  defaultFolder?: string | null
  defaultTag?: string | null
  // O pai está esperando a API responder
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: [note: NoteInput]
  delete: [note: EditableNote]
}>()

const headingId = 'note-editor-title'

const modalVisible = ref(false)
const title = ref('')
const content = ref('')
const folder = ref('')
const tagList = ref<string[]>([])
const isPinned = ref(false)
const tagDraft = ref('')
const newFolderOpen = ref(false)
const newFolderDraft = ref('')
const extraFolders = ref<string[]>([])
const errors = ref<{ title?: string; content?: string; folder?: string; tags?: string }>({})
const confirmDiscard = ref(false)

const contentInput = ref<HTMLTextAreaElement | null>(null)
const tagInput = ref<HTMLInputElement | null>(null)
const newFolderInput = ref<HTMLInputElement | null>(null)
const keepEditingBtn = ref<HTMLButtonElement | null>(null)

let initialState = ''

const isEditing = computed(() => !!props.note)

const sameName = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0

// Pastas para escolher: as do usuário, a da nota em edição e as criadas agora neste formulário
const folderChoices = computed(() => {
  const names = new Set<string>([...(props.folders ?? []), ...extraFolders.value])
  if (props.note?.folder) names.add(props.note.folder)
  if (folder.value) names.add(folder.value)

  const sorted = [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return [{ label: 'Sem pasta', value: '' }, ...sorted.map(name => ({ label: name, value: name }))]
})

// Sugestões: tags que o usuário já usa e que ainda não estão na nota (filtradas pelo que está sendo digitado)
const tagSuggestions = computed(() => {
  const typed = tagDraft.value.trim().toLowerCase()
  return (props.tags ?? [])
    .filter(tag => !tagList.value.some(chosen => sameName(chosen, tag)) && tag.toLowerCase().includes(typed))
    .slice(0, 8)
})

const snapshot = () => JSON.stringify([title.value, content.value, folder.value, tagList.value, isPinned.value])

// Há algo a perder: mudanças nos campos ou texto digitado que ainda não virou tag/pasta
const isDirty = computed(
  () => snapshot() !== initialState || tagDraft.value.trim() !== '' || newFolderDraft.value.trim() !== ''
)

const loadForm = () => {
  const note = props.note
  title.value = note?.title ?? ''
  content.value = note?.content ?? ''
  folder.value = note ? (note.folder ?? '') : (props.defaultFolder ?? '')
  tagList.value = note ? [...(note.tags ?? [])] : props.defaultTag ? [props.defaultTag] : []
  isPinned.value = note?.isPinned ?? false

  tagDraft.value = ''
  newFolderOpen.value = false
  newFolderDraft.value = ''
  extraFolders.value = []
  errors.value = {}
  confirmDiscard.value = false
  initialState = snapshot()
}

watch(
  () => props.isOpen,
  open => {
    modalVisible.value = open
    if (open) loadForm()
  },
  { immediate: true }
)

watch(modalVisible, visible => {
  if (!visible) emit('close')
})

// ---------- Fechar (sem perder o que foi digitado por acidente)

const onVisibleChange = (visible: boolean) => {
  if (!visible) requestClose()
}

const requestClose = async () => {
  if (isDirty.value) {
    confirmDiscard.value = true
    await nextTick()
    keepEditingBtn.value?.focus()
    return
  }
  modalVisible.value = false
}

const discard = () => {
  confirmDiscard.value = false
  modalVisible.value = false
}

// ---------- Pasta

const selectFolder = (value: string) => {
  folder.value = value
  errors.value.folder = ''
}

const openNewFolder = async () => {
  newFolderOpen.value = true
  await nextTick()
  newFolderInput.value?.focus()
}

const confirmNewFolder = () => {
  const name = newFolderDraft.value.trim().replace(/\s+/g, ' ')
  newFolderOpen.value = false
  newFolderDraft.value = ''
  if (!name) return

  // Digitar uma pasta que já existe só seleciona a existente
  const existing = folderChoices.value.find(option => option.value && sameName(option.value, name))
  if (existing) {
    selectFolder(existing.value)
    return
  }

  extraFolders.value.push(name)
  selectFolder(name)
}

const cancelNewFolder = () => {
  newFolderOpen.value = false
  newFolderDraft.value = ''
}

// ---------- Tags

const addTag = (raw: string) => {
  const tag = raw.trim().replace(/\s+/g, ' ')
  if (!tag || tagList.value.some(existing => sameName(existing, tag))) return

  if (tagList.value.length >= MAX_TAGS) {
    errors.value.tags = `Use no máximo ${MAX_TAGS} tags`
    return
  }

  tagList.value.push(tag)
  errors.value.tags = ''
}

const removeTag = (tag: string) => {
  tagList.value = tagList.value.filter(existing => existing !== tag)
  errors.value.tags = ''
}

const commitTagDraft = () => {
  if (tagDraft.value.trim()) addTag(tagDraft.value)
  tagDraft.value = ''
}

// Colar "a, b, c" cria as três tags; a vírgula também fecha a tag que está sendo digitada
watch(tagDraft, value => {
  if (!value.includes(',')) return

  const parts = value.split(',')
  tagDraft.value = (parts.pop() ?? '').trimStart()
  parts.forEach(addTag)
})

const onTagBackspace = () => {
  if (tagDraft.value === '' && tagList.value.length > 0) tagList.value.pop()
}

const focusTagInput = () => tagInput.value?.focus()
const focusContent = () => contentInput.value?.focus()

// ---------- Salvar / excluir

const validate = () => {
  const next: typeof errors.value = {}

  if (!title.value.trim()) next.title = 'Dê um título à nota'
  else if (title.value.trim().length > 200) next.title = 'O título deve ter no máximo 200 caracteres'

  if (content.value.trim().length > 1000) next.content = 'A anotação deve ter no máximo 1000 caracteres'

  if (folder.value.trim().length > 100) next.folder = 'O nome da pasta deve ter no máximo 100 caracteres'

  if (tagList.value.length > MAX_TAGS) next.tags = `Use no máximo ${MAX_TAGS} tags`
  else if (tagList.value.some(tag => tag.length > 50)) next.tags = 'Cada tag deve ter no máximo 50 caracteres'

  // addTag pode ter recusado uma tag por excesso: mantém o aviso
  errors.value = { ...next, tags: next.tags ?? errors.value.tags }
  return !errors.value.title && !errors.value.content && !errors.value.folder && !errors.value.tags
}

const handleSubmit = () => {
  if (props.saving) return

  // Texto digitado e ainda não confirmado (tag, pasta nova) também faz parte da nota
  commitTagDraft()
  if (newFolderOpen.value) confirmNewFolder()

  if (!validate()) {
    if (errors.value.title) document.getElementById('note-title')?.focus()
    return
  }

  emit('saved', {
    title: title.value.trim(),
    content: content.value.trim(),
    folder: folder.value.trim() || null,
    tags: [...tagList.value],
    isPinned: isPinned.value
  })
}

const handleDelete = () => {
  if (props.note) emit('delete', props.note)
}
</script>

<style scoped>
.editor-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.fav-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.fav-toggle:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.fav-toggle.active {
  color: var(--star);
  border-color: color-mix(in srgb, var(--star) 55%, transparent);
  background: color-mix(in srgb, var(--star) 12%, transparent);
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.optional {
  font-weight: 400;
  color: var(--text-tertiary);
}

.counter {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.counter.limit {
  color: var(--danger);
  font-weight: 600;
}

.field-input,
.tag-box,
.choice-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.field-input {
  padding: 10px 12px;
}

textarea.field-input {
  min-height: 120px;
  line-height: 1.5;
  resize: vertical;
}

.field-input::placeholder,
.tag-input::placeholder,
.choice-input::placeholder {
  color: var(--text-tertiary);
}

.field-input:focus,
.tag-box:focus-within,
.choice-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.field-input[aria-invalid='true'] {
  border-color: var(--danger);
}

.field-error {
  font-size: 12px;
  color: var(--danger);
}

/* Pasta: botões de escolha (sem lista flutuante) */
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding: 2px;
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.choice:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.choice.active {
  background: var(--accent-soft);
  border-color: var(--accent-color);
  color: var(--accent-text);
}

.choice.add {
  border-style: dashed;
}

.choice-input {
  width: 180px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
}

/* Tags: chips dentro do campo */
.tag-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  min-height: 42px;
  cursor: text;
}

.chips {
  display: contents;
  list-style: none;
  margin: 0;
  padding: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
}

.chip-remove {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
}

.chip-remove:hover {
  background: var(--hover-bg);
  color: var(--danger);
}

.tag-input {
  flex: 1;
  min-width: 140px;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
}

.tag-input:focus {
  outline: none;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.suggestions-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.chip.suggestion {
  padding: 3px 10px;
  background: transparent;
  border-style: dashed;
  color: var(--text-secondary);
  cursor: pointer;
}

.chip.suggestion:hover {
  background: var(--accent-soft);
  border-color: var(--accent-color);
  color: var(--accent-text);
}

.chip.suggestion .pi {
  font-size: 10px;
}

/* Rodapé */
.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.foot-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.foot-actions.discard {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.discard-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-primary {
  background: var(--accent-strong);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #166534;
}

.btn-ghost {
  background: transparent;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-ghost:hover {
  background: var(--hover-bg);
}

.btn-danger {
  background: transparent;
  color: var(--danger);
}

.btn-danger:hover {
  background: var(--danger-soft);
}

/* Vermelho fixo: o --danger do tema escuro é claro demais para texto branco (contraste AA) */
.btn-danger.solid {
  background: #b91c1c;
  color: #ffffff;
}

.btn-danger.solid:hover {
  background: #991b1b;
}

@media (max-width: 480px) {
  .editor-foot {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .foot-actions {
    margin-left: 0;
    justify-content: stretch;
  }

  .foot-actions .btn {
    flex: 1;
  }

  .choice-input {
    width: 100%;
  }
}

:deep(.p-dialog-content) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
