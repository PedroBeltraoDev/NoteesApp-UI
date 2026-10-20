// Cada pasta ganha sempre a mesma cor (borda do card e avatar), para o olho agrupar as notas.
// Notas sem pasta usam o verde da marca.
const PALETTE = ['--note-green', '--note-sky', '--note-amber', '--note-violet', '--note-coral', '--note-teal'] as const

function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

export function noteColorVar(folder?: string | null): string {
  const name = folder?.trim()
  if (!name) return 'var(--accent-color)'

  // Minúsculas e sem acento: "Trabalho" e "trabalho" têm a mesma cor
  const key = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return `var(${PALETTE[hash(key) % PALETTE.length]})`
}
