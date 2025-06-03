import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {
  name: string | null = '';
  avatarUrl: string | null = '';

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (user && user.user_metadata) {
      this.name = user.user_metadata['name'] || 'Usuario';
      this.avatarUrl = user.user_metadata['avatar_url'] || '';
    }
  }

  goToChat() {
    this.router.navigate(['/chat']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
