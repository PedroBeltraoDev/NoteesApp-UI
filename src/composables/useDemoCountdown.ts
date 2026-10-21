import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { demoRemainingMs, expireDemo } from '@/services/demo'

const URGENT_MS = 5 * 60_000

const pad = (value: number) => String(value).padStart(2, '0')

// Contagem regressiva da conta demo. Quando chega a zero, encerra a sessão e dispara o aviso de tempo esgotado.
export function useDemoCountdown() {
  const now = ref(Date.now())
  const remainingMs = computed(() => demoRemainingMs(now.value))

  const isDemo = computed(() => remainingMs.value !== null)
  const urgent = computed(() => remainingMs.value !== null && remainingMs.value <= URGENT_MS)

  // mm:ss (arredonda para cima: com 0,4 s sobrando ainda mostra 00:01)
  const label = computed(() => {
    const totalSeconds = Math.ceil((remainingMs.value ?? 0) / 1000)
    return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
  })

  // Para leitores de tela: muda uma vez por minuto (anunciar a cada segundo seria insuportável)
  const minutesLeft = computed(() => Math.max(1, Math.ceil((remainingMs.value ?? 0) / 60_000)))

  let timer: ReturnType<typeof setInterval> | null = null

  const tick = () => {
    now.value = Date.now()
    if (remainingMs.value !== null && remainingMs.value <= 0) expireDemo()
  }

  // Aba em segundo plano esfria os timers: ao voltar, confere o prazo na hora
  const onVisible = () => {
    if (document.visibilityState === 'visible') tick()
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', onVisible)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return { isDemo, remainingMs, label, minutesLeft, urgent }
}
