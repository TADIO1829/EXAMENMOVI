import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { Subscription } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { SupabaseService } from '../services/supabase.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { v4 as uuidv4 } from 'uuid';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // 👈 Import HttpClientModule

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    HttpClientModule // 👈 *** ADD THIS LINE ***
  ]
})
export class ChatPage implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage = '';
  messagesSub?: Subscription;

  currentUserId = '';
  currentUserName = '';
  currentUserAvatar = '';

  constructor(
    private chatService: ChatService,
    private supabase: SupabaseService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const user = await this.supabase.client.auth.getUser();
    if (user.data.user) {
        this.currentUserId = user.data.user.id;
        this.currentUserName = user.data.user.user_metadata?.['name'] ?? 'Anónimo';
        this.currentUserAvatar = user.data.user.user_metadata?.['avatar_url'] ?? '';
    } else {
        console.warn('User not logged in for ChatPage');
        // Handle case where user is not available, perhaps redirect or show a message
        this.currentUserName = 'Anónimo'; // Default if no user
    }


    await this.chatService.loadMessages();

    this.messagesSub = this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.cd.detectChanges(); // Forzar actualización UI
    });

    this.chatService.subscribeToMessages();
  }

  ngOnDestroy() {
    this.messagesSub?.unsubscribe();
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUserId) return;

    await this.chatService.sendMessage({
      user_id: this.currentUserId,
      user_name: this.currentUserName,
      avatar_url: this.currentUserAvatar,
      message: this.newMessage.trim(),
      type: 'text'
    });

    this.newMessage = '';
  }

  async sendLocation() {
    if (!this.currentUserId) return;
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = coordinates.coords;

      const locationMessage = `${latitude},${longitude}`;

      await this.chatService.sendMessage({
        user_id: this.currentUserId,
        user_name: this.currentUserName,
        avatar_url: this.currentUserAvatar,
        message: locationMessage,
        type: 'location'
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  }

  async sendPhoto() {
    if (!this.currentUserId) return;
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      if (!photo.webPath) return;

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const fileName = `${uuidv4()}.jpeg`;

      const { data, error: uploadError } = await this.supabase.client.storage
        .from('chat-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Error subiendo foto:', uploadError);
        return;
      }

      const { data: publicUrlData } = this.supabase.client.storage
        .from('chat-photos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        console.error('No se pudo obtener la URL pública de la imagen');
        return;
      }

      console.log('URL pública imagen:', publicUrl);

      await this.chatService.sendMessage({
        user_id: this.currentUserId,
        user_name: this.currentUserName,
        avatar_url: this.currentUserAvatar,
        message: publicUrl,
        type: 'image'
      });

    } catch (error) {
      console.error('Error enviando foto:', error);
    }
  }
  enviarFraseChuckNorris() {
  this.http.get<any>('https://api.chucknorris.io/jokes/random').subscribe({
    next: async (response) => {
      await this.chatService.sendMessage({
        user_id: 'chuck-id', // Or this.currentUserId if Chuck should send as the current user
        user_name: 'ChuckBot',
        avatar_url: 'https://api.chucknorris.io/img/chucknorris_logo_coloured_small.png',
        message: response.value,
        type: 'text'
      });
    },
    error: (err) => {
      console.error('Error al obtener frase de Chuck Norris:', err);
    }
  });
}

}