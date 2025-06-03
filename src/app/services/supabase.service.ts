import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  client: SupabaseClient;

  constructor() {
    this.client = createClient(
      'https://imnnjgfzwgdzuvjuvjyz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltbm5qZ2Z6d2dkenV2anV2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTc1NjAsImV4cCI6MjA2Mzg3MzU2MH0.TbHCEdtPz3tw88qOChQJSlBfLVLSsjc5Ck2Vuw95Xz4'
    );
  }
}