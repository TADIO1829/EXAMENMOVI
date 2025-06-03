import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ChatMessage } from '../models/chat-message.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private channel: any;

  constructor(private supabase: SupabaseService) {}

  async loadMessages() {
    const { data, error } = await this.supabase.client
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando mensajes:', error);
    } else {
      this.messagesSubject.next(data ?? []);
    }
  }

  subscribeToMessages() {
    this.channel = this.supabase.client
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: { new: ChatMessage }) => {
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, payload.new]);
        }
      )
      .subscribe();
  }

  unsubscribe() {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
  }

  async sendMessage(msg: ChatMessage) {
    const { error } = await this.supabase.client
      .from('messages')
      .insert([msg]);

    if (error) {
      console.error('Error enviando mensaje:', error);
    }
  }
}
