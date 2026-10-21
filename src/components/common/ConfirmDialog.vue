<template>
  <PDialog
    :visible="isOpen"
    :modal="true"
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="true"
    :breakpoints="{ '480px': '92vw' }"
    :style="{ width: '440px' }"
    :aria-labelledby="titleId"
    class="confirm-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
    </template>

    <p class="message">{{ message }}</p>

    <template #footer>
      <!-- Cancelar recebe o foco: confirmar uma exclusão sem querer exige um gesto a mais -->
      <button type="button" class="btn btn-ghost" autofocus @click="emit('cancel')">Cancelar</button>
      <button type="button" class="btn btn-danger solid" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Excluindo...' : confirmLabel }}
      </button>
    </template>
  </PDialog>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const titleId = 'confirm-dialog-title'

const onVisibleChange = (visible: boolean) => {
  if (!visible) emit('cancel')
}
</script>

<style scoped>
.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.message {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}
</style>
