// Minúsculas e sem acentos: "reuniao" encontra "Reunião"
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

interface Searchable {
  title: string
  content: string
  tags?: string[]
  folder?: string | null
}

// Filtra uma cópia da lista (nunca altera a original): apagar letras da busca traz as notas de volta.
// Todos os termos precisam aparecer em algum campo (título, conteúdo, tags ou pasta).
export function filterNotes<T extends Searchable>(notes: T[], query: string): T[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return notes

  return notes.filter(note => {
    const haystack = normalizeText(
      [note.title, note.content, note.folder ?? '', ...(note.tags ?? [])].join(' ')
    )
    return terms.every(term => haystack.includes(term))
  })
}
