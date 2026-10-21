// Mantém a API acordada enquanto o app está em uso.
//
// A API roda como função serverless: depois de ~30 s sem receber nada ela "dorme", e a próxima requisição paga uma
// partida a frio de vários segundos (e o banco, depois de uns 5 min parado, também precisa acordar). Um ping leve
// a cada poucos segundos, só enquanto você está mexendo no app, evita que a pausa para ler uma nota vire espera.

// Menos que o tempo em que a API esfria
export const PING_EVERY_MS = 20_000
// Sem mexer no app por este tempo, para de pingar (assim o banco do Neon pode dormir e não gastamos horas de uso)
export const ACTIVE_WINDOW_MS = 4 * 60_000

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const

let lastCall = 0 // última vez que a API recebeu algo (requisição real ou ping)
let lastActivity = 0 // última vez que o usuário mexeu no app
let timer: ReturnType<typeof setInterval> | null = null
let stop: (() => void) | null = null

// As requisições reais também mantêm a API acordada: não precisa pingar logo depois de uma
export function markApiCall() {
  lastCall = Date.now()
}

function ping(baseUrl: string) {
  markApiCall()

  // /health/ready passa pelo banco, então acorda a API e o Neon de uma vez. A resposta não importa:
  // "no-cors" evita erro no console e qualquer falha aqui é ignorada.
  fetch(`${baseUrl}/health/ready`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
}

export function startKeepAlive(baseUrl: string) {
  if (stop || typeof document === 'undefined') return stop ?? (() => {})

  const visible = () => document.visibilityState === 'visible'
  const recentlyUsed = () => Date.now() - lastActivity < ACTIVE_WINDOW_MS
  const stale = () => Date.now() - lastCall >= PING_EVERY_MS

  const onActivity = () => {
    const wasIdle = !recentlyUsed()
    lastActivity = Date.now()
    // Voltou a mexer depois de uma pausa longa: acorda a API já, antes da próxima ação do usuário
    if (wasIdle && stale() && visible()) ping(baseUrl)
  }

  const onVisibility = () => {
    if (visible() && stale()) ping(baseUrl)
  }

  lastActivity = Date.now()
  ping(baseUrl) // abrir o app (ou a tela de login) já acorda a API, enquanto a pessoa ainda está digitando

  timer = setInterval(() => {
    if (visible() && recentlyUsed() && stale()) ping(baseUrl)
  }, PING_EVERY_MS / 2)

  ACTIVITY_EVENTS.forEach(name => window.addEventListener(name, onActivity, { passive: true }))
  document.addEventListener('visibilitychange', onVisibility)

  stop = () => {
    if (timer) clearInterval(timer)
    timer = null
    ACTIVITY_EVENTS.forEach(name => window.removeEventListener(name, onActivity))
    document.removeEventListener('visibilitychange', onVisibility)
    stop = null
  }

  return stop
}
