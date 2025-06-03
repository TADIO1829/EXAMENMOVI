export interface ChatMessage {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  message: string;
  created_at?: string | Date;
  type?: 'text' | 'image' | 'location';  // <- Agrega esta línea
}
