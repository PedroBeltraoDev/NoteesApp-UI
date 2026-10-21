<template>
  <div v-if="isDemo" class="demo-banner" :class="{ urgent }">
    <i class="pi pi-clock demo-icon" aria-hidden="true"></i>

    <p class="demo-text">
      <strong>Conta demo.</strong>
      Será apagada em <span class="demo-time" aria-hidden="true">{{ label }}</span>
      <span class="sr-only" role="status">Conta demo: restam {{ minutesLeft }} {{ minutesLeft === 1 ? 'minuto' : 'minutos' }}</span>
    </p>

    <button type="button" class="demo-action" :disabled="leaving" @click="createRealAccount">Criar conta real</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDemoCountdown } from '@/composables/useDemoCountdown'
import { authService } from '@/services/authService'

const router = useRouter()
const { isDemo, label, minutesLeft, urgent } = useDemoCountdown()
const leaving = ref(false)

// Sai da demo (o que foi criado nela não é levado) e abre o cadastro
const createRealAccount = async () => {
  leaving.value = true
  await authService.logout()
  await router.push({ path: '/login', query: { modo: 'cadastro' } })
  leaving.value = false
}
</script>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 12px 10px 16px;
  background: color-mix(in srgb, var(--star) 14%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--star) 45%, transparent);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
}

.demo-banner.urgent {
  background: color-mix(in srgb, var(--danger) 14%, var(--bg-secondary));
  border-color: color-mix(in srgb, var(--danger) 55%, transparent);
}

.demo-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--star);
}

.urgent .demo-icon {
  color: var(--danger);
}

.demo-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  line-height: 1.4;
}

.demo-time {
  display: inline-block;
  min-width: 3.2em;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.demo-action {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 14px;
  background: var(--accent-strong);
  border: none;
  border-radius: var(--radius-sm);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.demo-action:hover:not(:disabled) {
  background: #166534;
}

.demo-action:disabled {
  opacity: 0.6;
  cursor: progress;
}

@media (max-width: 520px) {
  .demo-banner {
    flex-wrap: wrap;
  }

  .demo-action {
    flex: 1 1 100%;
  }
}
</style>
