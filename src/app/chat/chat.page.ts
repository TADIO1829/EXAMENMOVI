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

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
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
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const user = await this.supabase.client.auth.getUser();
    this.currentUserId = user.data.user?.id ?? '';
    this.currentUserName = user.data.user?.user_metadata?.['name'] ?? 'Anónimo';
    this.currentUserAvatar = user.data.user?.user_metadata?.['avatar_url'] ?? '';

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
    if (!this.newMessage.trim()) return;

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
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      if (!photo.webPath) return;

      // Obtener blob desde URI
      const response = await fetch(photo.webPath);
      const blob = await response.blob();

      // Nombre único para la foto
      const fileName = `${uuidv4()}.jpeg`;

      // Subir foto a Supabase Storage
      const { data, error: uploadError } = await this.supabase.client.storage
        .from('chat-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Error subiendo foto:', uploadError);
        return;
      }

      // Obtener URL pública de la foto
      const { data: publicUrlData } = this.supabase.client.storage
        .from('chat-photos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        console.error('No se pudo obtener la URL pública de la imagen');
        return;
      }

      console.log('URL pública imagen:', publicUrl);

      // Enviar mensaje con URL de la imagen
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
}
