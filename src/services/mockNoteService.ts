import type { Note } from '../types/Note'

const notes: Note[] = []

async function getAllNotes(): Promise<Note[]> {
  return notes
}

async function createNote(newNote: Omit<Note, 'id'>): Promise<Note> {
  const note: Note = {
    ...newNote,
    id: Date.now(),
  }
  notes.push(note)
  return note
}

async function updateNote(id: number, updatedNote: Note): Promise<Note> {
  const noteIndex = notes.findIndex(n => n.id === id)
  if (noteIndex === -1) {
    throw new Error('Note not found')
  }
  notes[noteIndex] = updatedNote
  return notes[noteIndex]
}

async function deleteNote(id: number): Promise<boolean> {
  const noteIndex = notes.findIndex(n => n.id === id)
  if (noteIndex === -1) {
    throw new Error('Note not found')
  }
  notes.splice(noteIndex, 1)
  return true
}

async function searchNotes(query: string): Promise<Note[]> {
  return notes.filter(note => note.title.toLowerCase().includes(query.toLowerCase()))
}

async function filterNotesByFolder(notes: Note[], folderName: string): Promise<Note[]> {
  return notes.filter(note => note.folder === folderName)
}

async function filterNotesByTag(notes: Note[], tagName: string): Promise<Note[]> {
  return notes.filter(note => note.tags.includes(tagName))
}

export {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  filterNotesByFolder,
  filterNotesByTag,
}