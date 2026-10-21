// Pasta do usuário (GET /api/folders). Existe mesmo vazia; uma nota está em no máximo uma pasta.
export interface Folder {
  id: number
  name: string
  noteCount: number
  createdAt: string
}
