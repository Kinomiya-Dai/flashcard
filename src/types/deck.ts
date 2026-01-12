export interface DeckWithProgress {
  id: number;
  title: string;
  description: string | null;
  category_name: string | null;
  progress: number;
  card_count: number;
}