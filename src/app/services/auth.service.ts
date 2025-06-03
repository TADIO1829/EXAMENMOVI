import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async register(email: string, password: string, name: string, avatarUrl: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar_url: avatarUrl }
      }
    });
    return { data, error };
  }


async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return { data, error };
}

  async getUser() {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    return user;
  }

  async logout() {
    await this.supabase.client.auth.signOut();
  }
}
