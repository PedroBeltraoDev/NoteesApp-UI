<template>
  <article class="note-card" :class="{ favorite: note.isPinned }" :style="{ '--note-color': color }" @click="emit('edit', note)">
    <header class="note-top">
      <span class="note-avatar" aria-hidden="true">
        <i class="pi pi-folder"></i>
      </span>
      <div class="note-meta">
        <span class="note-folder-name">{{ note.folder || 'Sem pasta' }}</span>
        <time class="note-date" :datetime="note.createdAt">{{ formatDate(note.createdAt) }}</time>
      </div>
      <button
        type="button"
        class="icon-action star"
        :class="{ active: note.isPinned }"
        :title="note.isPinned ? 'Remover dos favoritos' : 'Favoritar'"
        :aria-label="`${note.isPinned ? 'Remover dos favoritos a nota' : 'Favoritar nota'} ${note.title}`"
        :aria-pressed="note.isPinned"
        @click.stop="emit('togglePin', note.id)"
      >
        <i :class="note.isPinned ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
      </button>
      <KebabMenu :items="menuItems" :label="`Mais ações para ${note.title}`" @select="onMenuSelect" />
    </header>

    <h3 class="note-title">
      <button type="button" class="note-open" @click.stop="emit('edit', note)">{{ note.title }}</button>
    </h3>

    <p v-if="note.content" class="note-content" :title="note.content">{{ note.content }}</p>

    <ul v-if="note.tags && note.tags.length > 0" class="note-tags" aria-label="Tags">
      <li v-for="tag in note.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KebabMenu, { type KebabItem } from '@/components/common/KebabMenu.vue'
import { noteColorVar } from '@/utils/noteColor'
import { formatNoteDate } from '@/utils/formatDate'
import type { Note } from '@/types/Note'

const props = defineProps<{ note: Note }>()

// Clicar no cartão abre a nota já para edição: não existe uma segunda tela só de leitura
const emit = defineEmits<{
  edit: [note: Note]
  delete: [id: number]
  togglePin: [id: number]
}>()

const color = computed(() => noteColorVar(props.note.folder))

const menuItems: KebabItem[] = [
  { key: 'edit', label: 'Editar', icon: 'pi pi-pencil' },
  { key: 'delete', label: 'Excluir', icon: 'pi pi-trash', danger: true }
]

const formatDate = (iso: string) => formatNoteDate(iso)

const onMenuSelect = (key: string) => {
  if (key === 'edit') emit('edit', props.note)
  else if (key === 'delete') emit('delete', props.note.id)
}
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
  gap: 4px;
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
  margin-left: 6px;
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

.note-tags {
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
</style>
