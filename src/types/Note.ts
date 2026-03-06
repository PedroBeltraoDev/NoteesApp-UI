export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  folder?: string | null; 
  isPinned: boolean;
}