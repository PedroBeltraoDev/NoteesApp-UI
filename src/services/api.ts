import { request } from './http'
import type { Note } from '../types/Note'
import type { Folder } from '../types/Folder'

// Só o que a API aceita: id, createdAt e updatedAt são decididos pelo servidor
export interface NoteInput {
  title: string
  content: string
  // A pasta é indicada pelo id (null = sem pasta). `folder` (nome) serve só para criar uma pasta nova junto com a nota.
  folderId?: number | null
  folder?: string | null
  tags: string[]
  isPinned: boolean
}

function toPayload(note: NoteInput): NoteInput {
  const folderId = note.folderId ?? null

  return {
    title: note.title,
    content: note.content,
    folderId,
    // O nome só vale quando não há id; se vierem os dois o servidor usa o id
    folder: folderId === null ? (note.folder ?? null) : null,
    tags: note.tags ?? [],
    isPinned: note.isPinned ?? false
  }
}

// Todas as chamadas exigem login e lançam ApiError em caso de falha (inclusive de rede).
// Quem chama decide como avisar o usuário.
export const api = {
  // Todas as notas do usuário: pastas, tags, busca e ordem são aplicadas na tela
  getNotes() {
    return request<Note[]>('/notes')
  },

  createNote(note: NoteInput) {
    return request<Note>('/notes', { method: 'POST', body: toPayload(note) })
  },

  updateNote(note: NoteInput & { id: number }) {
    return request<Note>(`/notes/${note.id}`, { method: 'PUT', body: toPayload(note) })
  },

  async deleteNote(id: number) {
    await request(`/notes/${id}`, { method: 'DELETE' })
  },

  getTags() {
    return request<string[]>('/notes/tags')
  },

  // Pastas (inclusive as vazias), com o total de notas de cada uma
  getFolders() {
    return request<Folder[]>('/folders')
  },

  createFolder(name: string) {
    return request<Folder>('/folders', { method: 'POST', body: { name } })
  },

  renameFolder(id: number, name: string) {
    return request<Folder>(`/folders/${id}`, { method: 'PUT', body: { name } })
  },

  // As notas da pasta não são apagadas: ficam sem pasta
  async deleteFolder(id: number) {
    await request(`/folders/${id}`, { method: 'DELETE' })
  }
}
