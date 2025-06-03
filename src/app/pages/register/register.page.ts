import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // IMPORTANTE para componentes Ion
import { CommonModule } from '@angular/common'; // IMPORTANTE para ngIf, ngFor, etc.
import { FormsModule } from '@angular/forms'; // IMPORTANTE para ngModel
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule], // Agrega aquí los módulos necesarios
})
export class RegisterPage {
  email = '';
  password = '';
  name = '';
  avatarUrl = '';

  constructor(private auth: AuthService, private router: Router) {}

  async register() {
    const { data, error } = await this.auth.register(this.email, this.password, this.name, this.avatarUrl);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Cuenta creada exitosamente');
      this.router.navigate(['/login']);
    }
  }
}

