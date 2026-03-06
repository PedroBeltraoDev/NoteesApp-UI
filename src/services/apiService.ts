import type { Note } from '../types/Note'

const API_BASE_URL = 'http://localhost:5216/api'

export const apiService = {
  // GET all notes
  async getAllNotes(): Promise<Note[]> {
    const response = await fetch(`${API_BASE_URL}/notes`)
    if (!response.ok) throw new Error('Failed to fetch notes')
    return await response.json()
  },

  // GET note by ID
  async getNoteById(id: number): Promise<Note> {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`)
    if (!response.ok) throw new Error('Failed to fetch note')
    return await response.json()
  },

  // GET search notes
  async searchNotes(query: string): Promise<Note[]> {
    const response = await fetch(`${API_BASE_URL}/notes/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error('Failed to search notes')
    return await response.json()
  },

  // POST create note
  async createNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    })
    if (!response.ok) throw new Error('Failed to create note')
    return await response.json()
  },

  // PUT update note
  async updateNote(id: number, note: Partial<Note>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    })
    if (!response.ok) throw new Error('Failed to update note')
  },

  // DELETE note
  async deleteNote(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete note')
  },
}