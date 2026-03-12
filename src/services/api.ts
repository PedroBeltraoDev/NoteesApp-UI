const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noteesapp-be.onrender.com/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const api = {
  async getNotes(folder?: string | null, tag?: string | null) {
    try {
      const params = new URLSearchParams()
      if (folder) params.append('folder', folder)
      if (tag) params.append('tag', tag)
      
      const res = await fetch(`${API_BASE_URL}/notes?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<any[]> = await res.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      return []
    }
  },
  
  async getFolders() {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/folders`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<string[]> = await res.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Erro ao buscar pastas:', error)
      return []
    }
  },
  
  async getTags() {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/tags`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<string[]> = await res.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Erro ao buscar tags:', error)
      return []
    }
  },
  
  async createNote(note: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<any> = await res.json()
      return result.success ? result.data : result
    } catch (error) {
      console.error('Erro ao criar nota:', error)
      throw error
    }
  },
  
  async updateNote(note: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<any> = await res.json()
      return result.success ? result.data : result
    } catch (error) {
      console.error('Erro ao atualizar nota:', error)
      throw error
    }
  },
  
  async deleteNote(id: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const result: ApiResponse<any> = await res.json()
      return result.success
    } catch (error) {
      console.error('Erro ao excluir nota:', error)
      return false
    }
  }
}