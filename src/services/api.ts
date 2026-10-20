import { request } from './http'
import type { Note } from '../types/Note'

// Só o que a API aceita: id, createdAt e updatedAt são decididos pelo servidor
export interface NoteInput {
  title: string
  content: string
  folder?: string | null
  tags: string[]
  isPinned: boolean
}

function toPayload(note: NoteInput): NoteInput {
  return {
    title: note.title,
    content: note.content,
    folder: note.folder ?? null,
    tags: note.tags ?? [],
    isPinned: note.isPinned ?? false
  }
}

// Todas as chamadas exigem login e lançam ApiError em caso de falha (inclusive de rede).
// Quem chama decide como avisar o usuário.
export const api = {
  getNotes(folder?: string | null, tag?: string | null) {
    return request<Note[]>('/notes', { query: { folder, tag } })
  },

  getFolders() {
    return request<string[]>('/notes/folders')
  },

  getTags() {
    return request<string[]>('/notes/tags')
  },

  createNote(note: NoteInput) {
    return request<Note>('/notes', { method: 'POST', body: toPayload(note) })
  },

  updateNote(note: NoteInput & { id: number }) {
    return request<Note>(`/notes/${note.id}`, { method: 'PUT', body: toPayload(note) })
  },

  async deleteNote(id: number) {
    await request(`/notes/${id}`, { method: 'DELETE' })
  }
}
