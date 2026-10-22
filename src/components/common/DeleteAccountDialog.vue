<template>
  <PDialog
    :visible="isOpen"
    :modal="true"
    :closable="!busy"
    :closeOnEscape="!busy"
    :dismissableMask="!busy"
    :breakpoints="{ '480px': '92vw' }"
    :style="{ width: '460px' }"
    :aria-labelledby="titleId"
    class="delete-account-dialog"
    @update:visible="onVisibleChange"
  >
    <template #header>
      <h2 :id="titleId" class="dialog-title">Excluir sua conta?</h2>
    </template>

    <form id="delete-account-form" class="delete-form" novalidate @submit.prevent="submit">
      <p v-if="isDemo" class="message">
        Isso apaga agora a conta demo e tudo o que está nela. Ela seria apagada sozinha quando o tempo acabasse.
      </p>
      <template v-else>
        <p class="message">
          Isso apaga <strong>para sempre</strong> a sua conta, com todas as notas, pastas e tags. Não dá para desfazer.
        </p>

        <label for="delete-account-password" class="field-label">Para confirmar, digite sua senha</label>
        <input
          id="delete-account-password"
          ref="passwordInput"
          v-model="password"
          class="field-input"
          type="password"
          maxlength="128"
          autocomplete="current-password"
          autofocus
          :disabled="busy"
          :aria-invalid="!!shownError"
          :aria-describedby="shownError ? 'delete-account-error' : undefined"
          @input="edited = true"
        />
      </template>

      <small v-if="shownError" id="delete-account-error" class="field-error" role="alert">{{ shownError }}</small>
    </form>

    <template #footer>
      <!-- Na demo não há campo de senha: o foco vai para "Cancelar", como nas outras exclusões -->
      <button type="button" class="btn btn-ghost" :autofocus="isDemo || undefined" :disabled="busy" @click="emit('cancel')">
        Cancelar
      </button>
      <button type="submit" form="delete-account-form" class="btn btn-danger solid" :disabled="busy || !canSubmit">
        {{ busy ? 'Excluindo...' : 'Excluir conta' }}
      </button>
    </template>
  </PDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// Confirma a exclusão da conta. Conta com senha pede a senha atual; a demo (sem senha) só confirma.
// Erros do servidor (senha incorreta, sem conexão) chegam em `error`.
const props = defineProps<{
  isOpen: boolean
  isDemo?: boolean
  busy?: boolean
  error?: string
}>()

const emit = defineEmits<{
  confirm: [password: string]
  cancel: []
}>()

const titleId = 'delete-account-title'

const password = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)
// O erro some assim que a pessoa volta a digitar
const edited = ref(false)

const canSubmit = computed(() => props.isDemo || password.value.length > 0)
const shownError = computed(() => (props.error && !edited.value ? props.error : ''))

watch(
  () => props.isOpen,
  open => {
    if (!open) return
    password.value = ''
    edited.value = false
  },
  { immediate: true }
)

watch(
  () => props.error,
  () => {
    edited.value = false
  }
)

// Enquanto exclui, o campo fica desabilitado e perde o foco: se deu erro, devolve o foco para tentar de novo
watch(
  () => props.busy,
  async (busy, wasBusy) => {
    if (!wasBusy || busy || !props.error) return
    await nextTick()
    passwordInput.value?.focus()
    passwordInput.value?.select()
  }
)

const onVisibleChange = (visible: boolean) => {
  if (!visible && !props.busy) emit('cancel')
}

const submit = () => {
  if (props.busy || !canSubmit.value) return
  emit('confirm', props.isDemo ? '' : password.value)
}
</script>

<style scoped>
.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.delete-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.message {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.message strong {
  color: var(--text-primary);
}
</style>
