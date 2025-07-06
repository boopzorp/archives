export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  isFavorite?: boolean;
}
