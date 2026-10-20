<template>
  <article class="note-card" :class="{ favorite: note.isPinned }" :style="{ '--note-color': color }" @click="openFullNote">
    <header class="note-top" @click.stop>
      <span class="note-avatar" aria-hidden="true">
        <i class="pi pi-folder"></i>
      </span>
      <div class="note-meta">
        <span class="note-folder-name">{{ note.folder || 'Sem pasta' }}</span>
        <time class="note-date" :datetime="note.createdAt">{{ formatDate(note.createdAt) }}</time>
      </div>
      <KebabMenu :items="menuItems" :label="`Mais ações para ${note.title}`" @select="onMenuSelect" />
    </header>

    <h3 class="note-title">
      <button type="button" class="note-open" @click.stop="openFullNote">{{ note.title }}</button>
    </h3>

    <p class="note-content" :title="note.content">{{ note.content }}</p>

    <ul v-if="note.tags && note.tags.length > 0" class="note-tags" aria-label="Tags" @click.stop>
      <li v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>

    <footer class="note-actions" @click.stop>
      <button
        type="button"
        class="icon-action delete"
        title="Excluir"
        :aria-label="`Excluir nota ${note.title}`"
        @click="$emit('delete', note.id)"
      >
        <i class="pi pi-trash" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="icon-action star"
        :class="{ active: note.isPinned }"
        :title="note.isPinned ? 'Remover dos favoritos' : 'Favoritar'"
        :aria-label="`${note.isPinned ? 'Remover dos favoritos a nota' : 'Favoritar nota'} ${note.title}`"
        :aria-pressed="note.isPinned"
        @click="$emit('togglePin', note.id)"
      >
        <i :class="note.isPinned ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
      </button>
    </footer>
  </article>

  <!-- Modal de Visualização Completa -->
  <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
    <div
      ref="dialogEl"
      class="modal-full"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      :style="{ '--note-color': color }"
      @click.stop
      @keydown="onDialogKeydown"
    >
      <div class="modal-header">
        <h2 :id="titleId">{{ note.title }}</h2>
        <button ref="closeBtn" type="button" @click="closeModal" class="close-btn" aria-label="Fechar" title="Fechar">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="note-full-content">
          <p>{{ note.content }}</p>
        </div>
        <ul v-if="note.tags && note.tags.length > 0" class="note-full-tags" aria-label="Tags">
          <li v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</li>
        </ul>
        <div class="note-full-footer">
          <span class="note-date">{{ formatDate(note.createdAt) }}</span>
          <span v-if="note.folder" class="note-folder">
            <i class="pi pi-folder" aria-hidden="true"></i> {{ note.folder }}
          </span>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-edit" @click="editFromModal">
            <i class="pi pi-pencil" aria-hidden="true"></i> Editar nota
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import KebabMenu, { type KebabItem } from '@/components/common/KebabMenu.vue'
import { noteColorVar } from '@/utils/noteColor'
import { formatNoteDate } from '@/utils/formatDate'

const props = defineProps<{
  note: {
    id: number
    title: string
    content: string
    createdAt: string
    tags?: string[]
    folder?: string | null
    isPinned: boolean
  }
}>()

const emit = defineEmits(['edit', 'delete', 'togglePin'])

const isModalOpen = ref(false)
const dialogEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const titleId = computed(() => `note-dialog-title-${props.note.id}`)
const color = computed(() => noteColorVar(props.note.folder))

let previouslyFocused: HTMLElement | null = null

const menuItems: KebabItem[] = [
  { key: 'open', label: 'Abrir', icon: 'pi pi-eye' },
  { key: 'edit', label: 'Editar', icon: 'pi pi-pencil' },
  { key: 'delete', label: 'Excluir', icon: 'pi pi-trash', danger: true }
]

const formatDate = (iso: string) => formatNoteDate(iso)

const onMenuSelect = (key: string) => {
  if (key === 'open') openFullNote()
  else if (key === 'edit') emit('edit', props.note)
  else if (key === 'delete') emit('delete', props.note.id)
}

const openFullNote = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const editFromModal = () => {
  closeModal()
  emit('edit', props.note)
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

// Esc fecha e Tab/Shift+Tab ficam presos dentro do diálogo
const onDialogKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeModal()
    return
  }

  if (event.key !== 'Tab' || !dialogEl.value) return

  const focusable = Array.from(dialogEl.value.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (focusable.length === 0) return

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === dialogEl.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

// Ao abrir: trava a rolagem da página e leva o foco ao diálogo. Ao fechar: devolve o foco a quem abriu.
watch(isModalOpen, async open => {
  if (open) {
    previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeBtn.value?.focus()
  } else {
    document.body.style.overflow = ''
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }
})

onBeforeUnmount(() => {
  if (isModalOpen.value) document.body.style.overflow = ''
})
</script>

<style scoped>
.note-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid color-mix(in srgb, var(--note-color) 55%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.note-card:hover,
.note-card:focus-within {
  border-color: var(--note-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--note-color) 45%, transparent);
}

.note-top {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: default;
}

.note-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--note-color) 22%, transparent);
  color: var(--note-color);
  font-size: 16px;
}

.note-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.note-folder-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.note-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-title {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.note-open {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  overflow-wrap: anywhere;
}

.note-open:hover {
  text-decoration: underline;
}

.note-content {
  flex: 1;
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.note-tags,
.note-full-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.note-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  cursor: default;
}

.icon-action {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 17px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-action:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.icon-action.delete {
  color: var(--danger);
}

.icon-action.delete:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.icon-action.star.active {
  color: var(--star);
}

/* Alvos de toque de 44px em telas pequenas e dispositivos de toque */
@media (max-width: 768px), (pointer: coarse) {
  .icon-action {
    width: 44px;
    height: 44px;
  }
}

/* Modal de leitura */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
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
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--note-color) 60%, transparent);
  border-radius: var(--radius-md);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

.modal-full:focus {
  outline: none;
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
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.modal-full .modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.modal-full .close-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
}

.modal-full .close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-full .modal-body {
  padding: 24px;
}

.note-full-content {
  margin-bottom: 20px;
}

.note-full-content p {
  margin: 0;
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.note-full-tags {
  margin-bottom: 20px;
  padding-bottom: 20px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--note-color) 18%, transparent);
  border-radius: 999px;
  font-weight: 500;
  color: var(--text-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  background: var(--accent-strong);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-edit:hover {
  background: #166534;
}
</style>
