<template>
  <span class="app-logo" :class="{ 'with-wordmark': wordmark }">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 64 64"
      :role="wordmark ? undefined : 'img'"
      :aria-label="wordmark ? undefined : 'NoteesApp'"
      :aria-hidden="wordmark ? 'true' : undefined"
      focusable="false"
    >
      <defs>
        <linearGradient :id="gradientId" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#4ade80" />
          <stop offset="1" stop-color="#15803d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${gradientId})`" />
      <rect x="15" y="14" width="25" height="35" rx="4" transform="rotate(-10 27.5 31.5)" fill="#fff" fill-opacity=".38" />
      <path fill="#fff" d="M25 13h12l10 10v22a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z" />
      <path fill="#bbf7d0" d="M37 13v6a4 4 0 0 0 4 4h6L37 13Z" />
      <rect x="26" y="29" width="15" height="3" rx="1.5" fill="#16a34a" />
      <rect x="26" y="35" width="15" height="3" rx="1.5" fill="#86efac" />
      <rect x="26" y="41" width="9" height="3" rx="1.5" fill="#86efac" />
    </svg>
    <span v-if="wordmark" class="wordmark">Notees<span class="wordmark-accent">App</span></span>
  </span>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{ size?: number; wordmark?: boolean }>(), { size: 32, wordmark: false })

// id único por instância: vários logos na mesma página não disputam o mesmo gradiente
const gradientId = `logo-gradient-${useId()}`
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  line-height: 1;
}

.app-logo svg {
  flex-shrink: 0;
  display: block;
}

.wordmark {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.wordmark-accent {
  color: var(--accent-text);
}
</style>
