export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  isFavorite?: boolean;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
}
