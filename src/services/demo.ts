import { reactive } from 'vue'
import { session } from './session'

// Conta demo: temporária (o servidor impõe o prazo). Aqui ficam o estado "o tempo acabou" e as contas de prazo.

// O servidor responde 401 com errors.code = "demo_expired" quando a demo passou do prazo
export const DEMO_EXPIRED_CODE = 'demo_expired'

// Folga para diferença entre o relógio do aparelho e o do servidor
const CLOCK_GRACE_MS = 5_000

// Quando true a tela mostra o aviso de tempo esgotado (nova demo ou conta real)
export const demoState = reactive({ expired: false })

// Fim do prazo da demo atual, em ms; null se a sessão não é de uma demo
export function demoDeadline(): number | null {
  const user = session.user
  if (!user?.isDemo || !user.demoExpiresAt) return null

  const deadline = Date.parse(user.demoExpiresAt)
  return Number.isNaN(deadline) ? null : deadline
}

// Quanto falta (nunca negativo); null se a sessão não é de uma demo
export function demoRemainingMs(now = Date.now()): number | null {
  const deadline = demoDeadline()
  return deadline === null ? null : Math.max(0, deadline - now)
}

// O relógio chegou ao fim: encerra a sessão e mostra o aviso
export function expireDemo() {
  demoState.expired = true
  session.clear()
}

export function dismissDemoExpired() {
  demoState.expired = false
}

// Chamado antes de encerrar a sessão por um 401: foi a demo que acabou? O servidor avisa com o código, e se ele já
// apagou a conta a resposta é um 401 comum, então também vale o relógio.
export function noteSessionEnding(error?: { errors?: Record<string, string[]> }) {
  const code = error?.errors?.code?.[0]
  const remaining = demoRemainingMs()

  if (code === DEMO_EXPIRED_CODE || (remaining !== null && remaining <= CLOCK_GRACE_MS)) demoState.expired = true
}

// Ao abrir o app: uma demo salva no navegador que já venceu mostra o aviso em vez de uma tela de login sem explicação
export function checkStoredDemo() {
  const remaining = demoRemainingMs()
  if (remaining !== null && remaining <= 0) expireDemo()
}
