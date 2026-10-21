<template>
  <PDialog
    :visible="demoState.expired"
    :modal="true"
    :closable="false"
    :closeOnEscape="false"
    :dismissableMask="false"
    :breakpoints="{ '480px': '92vw' }"
    :style="{ width: '460px' }"
    :aria-labelledby="titleId"
    class="demo-expired-dialog"
  >
    <template #header>
      <h2 :id="titleId" class="dialog-title">
        <i class="pi pi-clock" aria-hidden="true"></i> O tempo da demo acabou
      </h2>
    </template>

    <p class="message">
      A conta demo é temporária e já foi encerrada, junto com as notas que você criou nela.
      Quer continuar mesmo assim?
    </p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template #footer>
      <div class="actions">
        <button type="button" class="btn btn-ghost" :disabled="loading" @click="createRealAccount">Criar conta real</button>
        <button type="button" class="btn btn-primary" autofocus :disabled="loading" @click="startNewDemo">
          {{ loading ? 'Criando...' : 'Criar nova conta demo' }}
        </button>
      </div>
    </template>
  </PDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/http'
import { demoState, dismissDemoExpired } from '@/services/demo'

const router = useRouter()
const titleId = 'demo-expired-title'
const loading = ref(false)
const error = ref('')

const startNewDemo = async () => {
  loading.value = true
  error.value = ''

  try {
    await authService.demo()
    dismissDemoExpired()
    await router.push('/')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Não foi possível criar a conta demo. Tente novamente.'
  } finally {
    loading.value = false
  }
}

const createRealAccount = async () => {
  dismissDemoExpired()
  await router.push({ path: '/login', query: { modo: 'cadastro' } })
}
</script>

<style scoped>
.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-title .pi {
  color: var(--star);
}

.message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.error {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--danger);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

@media (max-width: 480px) {
  .actions .btn {
    flex: 1 1 100%;
  }
}
</style>
