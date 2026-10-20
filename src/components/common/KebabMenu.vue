<template>
  <div class="kebab" ref="root">
    <button
      ref="trigger"
      type="button"
      class="kebab-trigger"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="label"
      :title="label"
      @click.stop="toggle"
      @keydown.down.prevent.stop="openAndFocus(0)"
    >
      <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
    </button>

    <div v-if="open" class="kebab-panel" role="menu" :aria-label="label" @click.stop @keydown="onKeydown">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        role="menuitem"
        class="kebab-item"
        :class="{ danger: item.danger }"
        @click="choose(item.key)"
      >
        <i :class="item.icon" aria-hidden="true"></i> {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

export interface KebabItem {
  key: string
  label: string
  icon: string
  danger?: boolean
}

defineProps<{ items: KebabItem[]; label: string }>()
const emit = defineEmits<{ select: [key: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const menuItems = () => Array.from(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

const close = (returnFocus = false) => {
  open.value = false
  if (returnFocus) trigger.value?.focus()
}

const openAndFocus = async (index: number) => {
  open.value = true
  await nextTick()
  menuItems()[index]?.focus()
}

const toggle = async () => {
  if (open.value) return close()
  await openAndFocus(0)
}

const choose = (key: string) => {
  close()
  emit('select', key)
}

const onKeydown = (event: KeyboardEvent) => {
  const list = menuItems()
  const current = list.indexOf(document.activeElement as HTMLElement)

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close(true)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    list[(current + 1) % list.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    list[(current - 1 + list.length) % list.length]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    list[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    list[list.length - 1]?.focus()
  } else if (event.key === 'Tab') {
    close()
  }
}

const onDocumentPointerDown = (event: Event) => {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<style scoped>
.kebab {
  position: relative;
}

.kebab-trigger {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.kebab-trigger:hover,
.kebab-trigger[aria-expanded='true'] {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.kebab-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 168px;
  padding: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  z-index: 30;
}

.kebab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.kebab-item:hover,
.kebab-item:focus-visible {
  background: var(--hover-bg);
}

.kebab-item.danger {
  color: var(--danger);
}

@media (max-width: 768px), (pointer: coarse) {
  .kebab-trigger {
    width: 44px;
    height: 44px;
  }

  .kebab-item {
    min-height: 44px;
  }
}
</style>
