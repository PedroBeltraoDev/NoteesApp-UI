const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5216/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const api = {
  async getNotes(folder?: string | null, tag?: string | null) {
    const params = new URLSearchParams()
    if (folder) params.append('folder', folder)
    if (tag) params.append('tag', tag)
    
    const res = await fetch(`${API_BASE_URL}/notes?${params}`)
    const result: ApiResponse<any[]> = await res.json()
    return result.success ? result.data : []
  }, 
  
  async getFolders() {
    const res = await fetch(`${API_BASE_URL}/notes/folders`)
    const result: ApiResponse<string[]> = await res.json()
    return result.success ? result.data : []
  },
  
  async getTags() {
    const res = await fetch(`${API_BASE_URL}/notes/tags`)
    const result: ApiResponse<string[]> = await res.json()
    return result.success ? result.data : []
  },
  
  async createNote(note: any) {
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    })
    const result: ApiResponse<any> = await res.json()
    return result.success ? result.data : result
  },
  
  async updateNote(note: any) {
    const res = await fetch(`${API_BASE_URL}/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    })
    const result: ApiResponse<any> = await res.json()
    return result.success ? result.data : result
  },
  
  async deleteNote(id: number) {
    const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE'
    })
    const result: ApiResponse<any> = await res.json()
    return result.success
  }
}  