import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  userType: UserType = 'user';
  email = '';
  agentCode = '';
  password = '';
  showErrors = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.showErrors = true;
    this.errorMessage = '';

    if (!this.password) {
      return;
    }

    if (this.userType === 'user' && !this.email) {
      return;
    }

    if (this.userType === 'mop' && !/^\d{5}$/.test(this.agentCode)) {
      this.errorMessage = 'Укажите код из 5 цифр.';
      return;
    }

    this.authService.login({
      type: this.userType,
      email: this.userType === 'user' ? this.email : undefined,
      identifier: this.userType === 'mop' ? this.agentCode : undefined,
      password: this.password
    }).subscribe({
      next: (response) => {
        alert(`Добро пожаловать, ${response.user.name}!`);
        // В будущем здесь будет редирект на защищенную страницу
        // this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Ошибка при входе';
      }
    });
  }

  selectUserType(type: UserType): void {
    this.userType = type;
    this.showErrors = false;
    this.errorMessage = '';
    if (type === 'user') {
      this.agentCode = '';
    } else {
      this.email = '';
    }
  }

  loginWithAuth0(): void {
    alert('Вход через Auth0 появится позже.');
  }
}
