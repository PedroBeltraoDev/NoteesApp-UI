<template>
  <PDialog
    :visible="isOpen"
    :modal="true"
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="true"
    :breakpoints="{ '480px': '92vw' }"
    :style="{ width: '420px' }"
    :aria-labelledby="titleId"
    class="folder-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <h2 :id="titleId" class="dialog-title">{{ isRename ? 'Renomear pasta' : 'Nova pasta' }}</h2>
    </template>

    <form id="folder-name-form" class="name-form" novalidate @submit.prevent="submit">
      <label for="folder-name" class="field-label">Nome da pasta</label>
      <input
        id="folder-name"
        v-model="name"
        class="field-input"
        type="text"
        maxlength="100"
        autocomplete="off"
        autofocus
        placeholder="Ex.: Trabalho"
        :aria-invalid="!!shownError"
        :aria-describedby="shownError ? 'folder-name-error' : undefined"
        @input="serverError = ''; localError = ''"
      />
      <small v-if="shownError" id="folder-name-error" class="field-error" role="alert">{{ shownError }}</small>
    </form>

    <template #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">Cancelar</button>
      <button type="submit" form="folder-name-form" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Salvando...' : isRename ? 'Salvar' : 'Criar pasta' }}
      </button>
    </template>
  </PDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Criar (sem `folder`) ou renomear (com `folder`) uma pasta. Erros do servidor (nome repetido) chegam em `error`.
const props = defineProps<{
  isOpen: boolean
  folder?: { id: number; name: string } | null
  error?: string
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [name: string]
}>()

const titleId = 'folder-dialog-title'

const name = ref('')
const localError = ref('')
const serverError = ref('')

const isRename = computed(() => !!props.folder)
const shownError = computed(() => localError.value || serverError.value)

watch(
  () => props.isOpen,
  open => {
    if (!open) return
    name.value = props.folder?.name ?? ''
    localError.value = ''
    serverError.value = ''
  },
  { immediate: true }
)

watch(
  () => props.error,
  value => {
    serverError.value = value ?? ''
  }
)

const onVisibleChange = (visible: boolean) => {
  if (!visible) emit('close')
}

const submit = () => {
  if (props.saving) return

  // Espaços nas pontas e repetidos não contam (o servidor faz o mesmo)
  const normalized = name.value.split(/\s+/).filter(Boolean).join(' ')

  if (!normalized) {
    localError.value = 'Dê um nome à pasta'
    return
  }

  // Renomear para o mesmo nome é só fechar
  if (props.folder && normalized === props.folder.name) {
    emit('close')
    return
  }

  emit('save', normalized)
}
</script>

<style scoped>
.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.name-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
</style>
