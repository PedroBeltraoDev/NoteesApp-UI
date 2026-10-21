<template>
  <div class="tile" :style="{ '--tile-color': color }">
    <button type="button" class="tile-open" @click="emit('open')">
      <span class="tile-icon" aria-hidden="true">
        <i :class="icon"></i>
      </span>
      <span class="tile-text">
        <span class="tile-name">{{ name }}</span>
        <span class="sr-only">, </span>
        <span class="tile-count">{{ countLabel }}</span>
      </span>
    </button>

    <KebabMenu v-if="menuItems && menuItems.length > 0" :items="menuItems" :label="`Mais ações para ${name}`" @select="emit('menu', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KebabMenu, { type KebabItem } from '@/components/common/KebabMenu.vue'

// Cartão de uma pasta ou de uma tag: nome, quantas notas tem e, se houver, um menu ⋮
const props = withDefaults(
  defineProps<{
    name: string
    count: number
    icon?: string
    color?: string
    menuItems?: KebabItem[]
  }>(),
  { icon: 'pi pi-folder', color: 'var(--accent-color)', menuItems: () => [] }
)

const emit = defineEmits<{
  open: []
  menu: [key: string]
}>()

const countLabel = computed(() => `${props.count} ${props.count === 1 ? 'nota' : 'notas'}`)
</script>

<style scoped>
.tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 4px;
  background: var(--card-bg);
  border: 1px solid color-mix(in srgb, var(--tile-color) 55%, transparent);
  border-radius: var(--radius-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.tile:hover,
.tile:focus-within {
  border-color: var(--tile-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--tile-color) 45%, transparent);
}

.tile-open {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tile-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--tile-color) 22%, transparent);
  color: var(--tile-color);
  font-size: 20px;
}

.tile-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.tile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.tile-count {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
