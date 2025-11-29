import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user.interface';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  userType: UserType = 'user';
  name = '';
  email = '';
  agentCode = '';
  password = '';
  confirmPassword = '';
  showErrors = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.showErrors = true;
    this.errorMessage = '';

    if (!this.name || !this.password) {
      return;
    }

    if (this.userType === 'user' && !this.email) {
      return;
    }

    if (this.userType === 'mop' && !/^\d{5}$/.test(this.agentCode)) {
      this.errorMessage = 'Код агента должен состоять из 5 цифр.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Пароли не совпадают';
      return;
    }

    this.authService.register({
      name: this.name,
      password: this.password,
      type: this.userType,
      email: this.userType === 'user' ? this.email : undefined,
      identifier: this.userType === 'mop' ? this.agentCode : undefined
    }).subscribe({
      next: (response) => {
        alert(`Аккаунт для ${response.user.name} успешно создан!`);
        // Автоматический вход уже выполнен в сервисе
        // В будущем здесь будет редирект на защищенную страницу
        // this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Ошибка при регистрации';
      }
    });
  }

  get passwordMismatch(): boolean {
    return this.showErrors && this.password !== this.confirmPassword && !!this.confirmPassword;
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
}
