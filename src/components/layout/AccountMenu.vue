<template>
  <div class="account-menu" ref="root">
    <button
      ref="trigger"
      type="button"
      class="icon-btn account-btn"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="account-menu-panel"
      aria-label="Conta"
      title="Conta"
      @click="toggle"
      @keydown.down.prevent="openAndFocus(0)"
    >
      <i class="pi pi-user" aria-hidden="true"></i>
    </button>

    <div v-if="open" id="account-menu-panel" class="account-panel" @keydown="onKeydown">
      <p v-if="email" class="account-email" :title="email">
        <span class="account-label">Conectado como</span>
        {{ email }}
      </p>

      <div role="menu" aria-label="Menu da conta">
        <button ref="firstItem" type="button" role="menuitem" class="menu-item" @click="choose('settings')">
          <i class="pi pi-cog" aria-hidden="true"></i> Configurações
        </button>
        <button type="button" role="menuitem" class="menu-item" @click="choose('logout')">
          <i class="pi pi-sign-out" aria-hidden="true"></i> Sair
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

defineProps<{ email?: string | null }>()
const emit = defineEmits<{ settings: []; logout: [] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const items = () => Array.from(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

const close = (returnFocus = false) => {
  open.value = false
  if (returnFocus) trigger.value?.focus()
}

const openAndFocus = async (index: number) => {
  open.value = true
  await nextTick()
  items()[index]?.focus()
}

const toggle = async () => {
  if (open.value) return close()
  await openAndFocus(0)
}

const choose = (action: 'settings' | 'logout') => {
  close()
  if (action === 'settings') emit('settings')
  else emit('logout')
}

const onKeydown = (event: KeyboardEvent) => {
  const list = items()
  const current = list.indexOf(document.activeElement as HTMLElement)

  if (event.key === 'Escape') {
    event.preventDefault()
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
    // Sair do menu com Tab fecha o painel sem prender o foco
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
.account-menu {
  position: relative;
}

.account-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 240px;
  max-width: min(320px, calc(100vw - 24px));
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 8px;
  z-index: 200;
}

.account-email {
  margin: 0;
  padding: 8px 12px 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-label {
  display: block;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: var(--hover-bg);
}
</style>
