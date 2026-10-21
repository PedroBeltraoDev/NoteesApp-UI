// Como a tela de notas organiza o que já está carregado: ordem por data, contagem por pasta e por tag.
// Tudo puro (sem rede nem Vue), para ser fácil de testar.

export type SortMode = 'newest' | 'oldest' | 'edited'

export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
  { value: 'edited', label: 'Editadas por último' }
]

export const DEFAULT_SORT: SortMode = 'newest'

export const isSortMode = (value: unknown): value is SortMode => SORT_OPTIONS.some(option => option.value === value)

interface Dated {
  id: number
  createdAt: string
  updatedAt?: string | null
}

const time = (iso?: string | null) => {
  const value = iso ? new Date(iso).getTime() : NaN
  return Number.isNaN(value) ? 0 : value
}

// Criação (mais recentes / mais antigas) ou última edição; uma nota nunca editada vale pela data de criação.
// O id desempata, para a ordem não mudar entre duas notas da mesma hora.
export function sortNotes<T extends Dated>(notes: T[], mode: SortMode): T[] {
  const key = (note: T) => (mode === 'edited' ? time(note.updatedAt) || time(note.createdAt) : time(note.createdAt))
  const direction = mode === 'oldest' ? 1 : -1

  return [...notes].sort((a, b) => direction * (key(a) - key(b)) || direction * (a.id - b.id))
}

const tagKey = (tag: string) => tag.trim().toLowerCase()

// "Importante" e "importante" são a mesma tag (como no servidor)
export const hasTag = (note: { tags?: string[] }, tag: string) => (note.tags ?? []).some(t => tagKey(t) === tagKey(tag))

export interface TagCount {
  name: string
  count: number
}

// Tags usadas, com quantas notas cada uma tem; mantém a grafia da primeira ocorrência
export function tagCounts(notes: { tags?: string[] }[]): TagCount[] {
  const found = new Map<string, TagCount>()

  for (const note of notes) {
    const seenInNote = new Set<string>()

    for (const raw of note.tags ?? []) {
      const key = tagKey(raw)
      if (!key || seenInNote.has(key)) continue

      seenInNote.add(key)
      const entry = found.get(key)
      if (entry) entry.count++
      else found.set(key, { name: raw.trim(), count: 1 })
    }
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

// Notas de uma pasta (null = notas sem pasta)
export const notesInFolder = <T extends { folderId?: number | null }>(notes: T[], folderId: number | null) =>
  notes.filter(note => (note.folderId ?? null) === folderId)
