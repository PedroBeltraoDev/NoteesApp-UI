import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api } from '@/services/api'
import { ApiError, API_BASE_URL } from '@/services/http'
import { session } from '@/services/session'
import { apiResponse, makeSession, mockFetch, resetSession } from '../helpers'

describe('notes api', () => {
  beforeEach(() => {
    resetSession()
    session.set(makeSession())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('getNotes filters by folder and tag', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: [{ id: 1 }] }))

    const notes = await api.getNotes('Trabalho', 'urgente')

    expect(notes).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes?folder=Trabalho&tag=urgente`)
  })

  it('getNotes without filters has no query string', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: [] }))

    await api.getNotes()

    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes`)
  })

  it('errors are no longer swallowed into an empty list', async () => {
    mockFetch(() => apiResponse(500))

    await expect(api.getNotes()).rejects.toBeInstanceOf(ApiError)
    await expect(api.getFolders()).rejects.toBeInstanceOf(ApiError)
    await expect(api.getTags()).rejects.toBeInstanceOf(ApiError)
  })

  it('updateNote sends only the fields the API accepts, to the id route', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: { id: 7 } }))

    await api.updateNote({
      id: 7,
      title: 'Título',
      content: 'Conteúdo da nota',
      tags: ['a'],
      isPinned: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
      userId: 'forjado'
    } as any)

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes/7`)
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({
      title: 'Título',
      content: 'Conteúdo da nota',
      folder: null,
      tags: ['a'],
      isPinned: true
    })
  })

  it('createNote posts the payload', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 1 } }))

    const created = await api.createNote({ title: 'T', content: 'Conteúdo da nota', tags: [], isPinned: false, folder: 'Pasta' })

    expect(created).toEqual({ id: 1 })
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('POST')
  })

  it('deleteNote resolves on success and rejects on failure', async () => {
    mockFetch(() => apiResponse(200))
    await expect(api.deleteNote(3)).resolves.toBeUndefined()

    mockFetch(() => apiResponse(404, { message: 'Nota não encontrada' }))
    await expect(api.deleteNote(3)).rejects.toMatchObject({ status: 404 })
  })
})
