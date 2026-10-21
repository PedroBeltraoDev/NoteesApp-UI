export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  tags: string[];
  // Pasta da nota: id e nome (null = sem pasta)
  folderId?: number | null;
  folder?: string | null;
  isPinned: boolean;
}
