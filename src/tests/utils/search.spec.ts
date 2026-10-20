import { describe, it, expect } from 'vitest'
import { filterNotes, normalizeText } from '@/utils/search'

const notes = [
  { id: 1, title: 'Reunião de planejamento', content: 'Revisar metas do trimestre', tags: ['importante'], folder: 'Trabalho' },
  { id: 2, title: 'Lista de compras', content: 'Leite, ovos e pão', tags: ['casa'], folder: 'Pessoal' },
  { id: 3, title: 'Receita de bolo', content: 'Misture ovos e farinha', tags: [], folder: null }
]

describe('normalizeText', () => {
  it('lowercases, trims and removes accents', () => {
    expect(normalizeText('  Reunião  ')).toBe('reuniao')
    expect(normalizeText('AÇÚCAR')).toBe('acucar')
  })
})

describe('filterNotes', () => {
  it('returns the very same list for an empty query', () => {
    expect(filterNotes(notes, '')).toBe(notes)
    expect(filterNotes(notes, '   ')).toBe(notes)
  })

  it('is accent- and case-insensitive', () => {
    expect(filterNotes(notes, 'REUNIAO').map(n => n.id)).toEqual([1])
    expect(filterNotes(notes, 'pao').map(n => n.id)).toEqual([2])
  })

  it('searches title, content, tags and folder', () => {
    expect(filterNotes(notes, 'trimestre').map(n => n.id)).toEqual([1]) // conteúdo
    expect(filterNotes(notes, 'casa').map(n => n.id)).toEqual([2]) // tag
    expect(filterNotes(notes, 'trabalho').map(n => n.id)).toEqual([1]) // pasta
    expect(filterNotes(notes, 'bolo').map(n => n.id)).toEqual([3]) // título
  })

  it('requires every term to match (in any field)', () => {
    expect(filterNotes(notes, 'ovos pao').map(n => n.id)).toEqual([2])
    expect(filterNotes(notes, 'ovos reuniao')).toEqual([])
  })

  it('never mutates the original list', () => {
    const copy = [...notes]

    filterNotes(notes, 'bolo')

    expect(notes).toEqual(copy)
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterNotes(notes, 'inexistente')).toEqual([])
  })
})
