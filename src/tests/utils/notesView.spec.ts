import { describe, it, expect } from 'vitest'
import { sortNotes, tagCounts, hasTag, notesInFolder, isSortMode, SORT_OPTIONS, DEFAULT_SORT } from '@/utils/notesView'

const note = (id: number, createdAt: string, updatedAt?: string | null) => ({ id, createdAt, updatedAt })

const ids = (notes: { id: number }[]) => notes.map(n => n.id)

describe('sortNotes', () => {
  const a = note(1, '2026-01-10T10:00:00Z', '2026-03-01T10:00:00Z') // criada primeiro, editada por último
  const b = note(2, '2026-02-10T10:00:00Z', null) // nunca editada
  const c = note(3, '2026-03-10T10:00:00Z', '2026-03-10T10:00:00Z')

  it('"Mais recentes" puts the latest created first', () => {
    expect(ids(sortNotes([a, c, b], 'newest'))).toEqual([3, 2, 1])
  })

  it('"Mais antigas" puts the oldest created first', () => {
    expect(ids(sortNotes([c, a, b], 'oldest'))).toEqual([1, 2, 3])
  })

  it('"Editadas por último" orders by the last edit; a note never edited counts by its creation date', () => {
    // a editada em 01/03, c em 10/03 (criação = edição), b sem edição vale 10/02
    expect(ids(sortNotes([a, b, c], 'edited'))).toEqual([3, 1, 2])
  })

  it('breaks ties by id in the same direction, so the order never flickers', () => {
    const same = '2026-05-05T10:00:00Z'
    const notes = [note(5, same), note(9, same), note(7, same)]

    expect(ids(sortNotes(notes, 'newest'))).toEqual([9, 7, 5])
    expect(ids(sortNotes(notes, 'oldest'))).toEqual([5, 7, 9])
  })

  it('does not change the list it receives', () => {
    const input = [a, b, c]

    sortNotes(input, 'newest')

    expect(ids(input)).toEqual([1, 2, 3])
  })

  it('does not break with a missing or invalid date (goes to the end of "recentes")', () => {
    const broken = note(4, 'não é data')

    expect(ids(sortNotes([broken, a], 'newest'))).toEqual([1, 4])
  })
})

describe('sort options', () => {
  it('offers three orders, newest first by default', () => {
    expect(SORT_OPTIONS.map(o => o.value)).toEqual(['newest', 'oldest', 'edited'])
    expect(DEFAULT_SORT).toBe('newest')
  })

  it('isSortMode accepts only the known orders', () => {
    expect(isSortMode('oldest')).toBe(true)
    expect(isSortMode('alfabetica')).toBe(false)
    expect(isSortMode(null)).toBe(false)
  })
})

describe('hasTag', () => {
  it('ignores case and surrounding spaces, like the server', () => {
    expect(hasTag({ tags: ['Importante'] }, 'importante')).toBe(true)
    expect(hasTag({ tags: ['  casa '] }, 'CASA')).toBe(true)
    expect(hasTag({ tags: ['casa'] }, 'carro')).toBe(false)
    expect(hasTag({}, 'casa')).toBe(false)
  })
})

describe('tagCounts', () => {
  it('counts the notes that use each tag, sorted by name', () => {
    const counts = tagCounts([{ tags: ['dotnet', 'di'] }, { tags: ['dotnet'] }, { tags: ['reunião'] }, { tags: [] }])

    expect(counts).toEqual([
      { name: 'di', count: 1 },
      { name: 'dotnet', count: 2 },
      { name: 'reunião', count: 1 }
    ])
  })

  it('joins spellings that differ only by case, keeping the first one', () => {
    const counts = tagCounts([{ tags: ['Importante'] }, { tags: ['importante'] }, { tags: ['IMPORTANTE'] }])

    expect(counts).toEqual([{ name: 'Importante', count: 3 }])
  })

  it('counts a note once even when it repeats a tag', () => {
    expect(tagCounts([{ tags: ['a', 'A', 'a'] }])).toEqual([{ name: 'a', count: 1 }])
  })

  it('ignores blank tags and notes without tags', () => {
    expect(tagCounts([{ tags: ['', '   '] }, {}, { tags: undefined }])).toEqual([])
  })
})

describe('notesInFolder', () => {
  const notes = [{ id: 1, folderId: 3 }, { id: 2, folderId: null }, { id: 3 }, { id: 4, folderId: 3 }, { id: 5, folderId: 8 }]

  it('returns the notes of a folder', () => {
    expect(ids(notesInFolder(notes, 3))).toEqual([1, 4])
  })

  it('null means notes with no folder (null or missing)', () => {
    expect(ids(notesInFolder(notes, null))).toEqual([2, 3])
  })

  it('a folder with no notes gives an empty list', () => {
    expect(notesInFolder(notes, 99)).toEqual([])
  })
})
