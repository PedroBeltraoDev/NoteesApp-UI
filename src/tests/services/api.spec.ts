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

  it('getNotes asks for every note, with no filters (the screen filters, sorts and counts them)', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: [{ id: 1 }] }))

    const notes = await api.getNotes()

    expect(notes).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/notes`)
  })

  it('errors are no longer swallowed into an empty list', async () => {
    mockFetch(() => apiResponse(500))

    await expect(api.getNotes()).rejects.toBeInstanceOf(ApiError)
    await expect(api.getFolders()).rejects.toBeInstanceOf(ApiError)
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
      folderId: null,
      folder: null,
      tags: ['a'],
      isPinned: true
    })
  })

  it('sends the folder by id and drops the name when there is an id (the server would use the id anyway)', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: { id: 7 } }))

    await api.updateNote({ id: 7, title: 'T', content: '', tags: [], isPinned: false, folderId: 3, folder: 'Nome antigo' })

    expect(JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)).toMatchObject({ folderId: 3, folder: null })
  })

  it('can create a new folder together with the note: only the name, no id', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 1 } }))

    await api.createNote({ title: 'T', content: '', tags: [], isPinned: false, folderId: null, folder: 'Viagens' })

    expect(JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)).toMatchObject({ folderId: null, folder: 'Viagens' })
  })

  it('a note with no folder sends neither id nor name', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 1 } }))

    await api.createNote({ title: 'T', content: '', tags: [], isPinned: false })

    expect(JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)).toMatchObject({ folderId: null, folder: null })
  })

  it('createNote posts the payload', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 1 } }))

    const created = await api.createNote({ title: 'T', content: 'Conteúdo da nota', tags: [], isPinned: false, folderId: 2 })

    expect(created).toEqual({ id: 1 })
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('POST')
  })

  it('deleteNote resolves on success and rejects on failure', async () => {
    mockFetch(() => apiResponse(200))
    await expect(api.deleteNote(3)).resolves.toBeUndefined()

    mockFetch(() => apiResponse(404, { message: 'Nota não encontrada' }))
    await expect(api.deleteNote(3)).rejects.toMatchObject({ status: 404 })
  })

  // ---------- Pastas

  it('getFolders lists the folders with their note counts', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: [{ id: 1, name: 'Trabalho', noteCount: 3 }] }))

    const folders = await api.getFolders()

    expect(folders).toEqual([{ id: 1, name: 'Trabalho', noteCount: 3 }])
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/folders`)
  })

  it('createFolder posts the name', async () => {
    const fetchMock = mockFetch(() => apiResponse(201, { data: { id: 5, name: 'Ideias', noteCount: 0 } }))

    const folder = await api.createFolder('Ideias')

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(folder.id).toBe(5)
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/folders`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Ideias' })
  })

  it('renameFolder puts the new name on the id route', async () => {
    const fetchMock = mockFetch(() => apiResponse(200, { data: { id: 5, name: 'Novo', noteCount: 2 } }))

    await api.renameFolder(5, 'Novo')

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/folders/5`)
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Novo' })
  })

  it('deleteFolder calls DELETE on the id route and resolves with nothing', async () => {
    const fetchMock = mockFetch(() => apiResponse(200))

    await expect(api.deleteFolder(5)).resolves.toBeUndefined()

    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_BASE_URL}/folders/5`)
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('DELETE')
  })

  it('a repeated folder name comes back as a 409 with the server message', async () => {
    mockFetch(() => apiResponse(409, { message: 'Já existe uma pasta com esse nome' }))

    await expect(api.createFolder('Trabalho')).rejects.toMatchObject({ status: 409, message: 'Já existe uma pasta com esse nome' })
  })
})
