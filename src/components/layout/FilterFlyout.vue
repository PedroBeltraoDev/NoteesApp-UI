<template>
  <div ref="root" class="flyout" role="dialog" :aria-label="title" @keydown="onKeydown">
    <div class="flyout-head">
      <h2 class="flyout-title">{{ title }}</h2>
      <button type="button" class="flyout-close" aria-label="Fechar" title="Fechar" @click="$emit('close')">
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </div>

    <ul v-if="items.length > 0" class="flyout-list">
      <li v-for="item in items" :key="item">
        <button
          type="button"
          class="flyout-item"
          :class="{ active: selected === item }"
          :aria-pressed="selected === item"
          @click="$emit('select', item)"
        >
          <i :class="kind === 'folders' ? 'pi pi-folder' : 'pi pi-hashtag'" aria-hidden="true"></i>
          <span class="flyout-name">{{ item }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="flyout-empty">{{ emptyText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'

const props = defineProps<{
  kind: 'folders' | 'tags'
  items: string[]
  selected: string | null
}>()

defineEmits<{ select: [value: string]; close: [] }>()

const root = ref<HTMLElement | null>(null)

const title = computed(() => (props.kind === 'folders' ? 'Pastas' : 'Tags'))
const emptyText = computed(() =>
  props.kind === 'folders'
    ? 'Nenhuma pasta ainda. Digite um nome de pasta ao criar uma nota.'
    : 'Nenhuma tag ainda. Adicione tags ao criar uma nota.'
)

const focusables = () => Array.from(root.value?.querySelectorAll<HTMLElement>('.flyout-item') ?? [])

const onKeydown = (event: KeyboardEvent) => {
  const list = focusables()
  const current = list.indexOf(document.activeElement as HTMLElement)

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    list[(current + 1) % list.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    list[(current - 1 + list.length) % list.length]?.focus()
  }
}

onMounted(async () => {
  await nextTick()
  // Foco no item ativo (ou no primeiro) para quem navega pelo teclado
  const target = root.value?.querySelector<HTMLElement>('.flyout-item.active') ?? focusables()[0]
  target?.focus()
})
</script>

<style scoped>
.flyout {
  width: 280px;
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.flyout-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 8px 16px;
  border-bottom: 1px solid var(--border-color);
}

.flyout-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.flyout-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}

.flyout-close:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.flyout-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}

.flyout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  background: none;
  border: none;
  border-radius: 10px;
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.flyout-item .pi {
  color: var(--text-secondary);
  font-size: 16px;
}

.flyout-item:hover {
  background: var(--hover-bg);
}

.flyout-item.active {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
}

.flyout-item.active .pi {
  color: var(--accent-text);
}

.flyout-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flyout-empty {
  margin: 0;
  padding: 20px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}
</style>
