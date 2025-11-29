import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, UserType } from '../models/user.interface';

interface RegisterPayload {
  name: string;
  password: string;
  type: UserType;
  email?: string;
  identifier?: string;
}

interface LoginPayload {
  password: string;
  type: UserType;
  email?: string;
  identifier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly CURRENT_USER_KEY = 'auth_current_user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // При инициализации проверяем, есть ли сохраненный токен
    // и загружаем данные пользователя
    if (this.getToken()) {
      this.loadCurrentUser().subscribe({
        error: () => {
          // Если токен невалидный, очищаем данные
          this.logout();
        }
      });
    }
  }

  /**
   * Регистрация нового пользователя
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, payload).pipe(
      tap(response => {
        // Сохраняем токен и пользователя
        this.setToken(response.token);
        this.setCurrentUser(response.user);
      })
    );
  }

  /**
   * Авторизация пользователя
   */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, payload).pipe(
      tap(response => {
        // Сохраняем токен и пользователя
        this.setToken(response.token);
        this.setCurrentUser(response.user);
      })
    );
  }

  /**
   * Выход из системы
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Получить текущего авторизованного пользователя
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Проверка авторизации
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getCurrentUser() !== null;
  }

  /**
   * Получить токен авторизации
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Получить заголовки с токеном для HTTP запросов
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Загрузить данные текущего пользователя с сервера
   */
  private loadCurrentUser(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.API_URL}/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        this.setCurrentUser(response.user);
      })
    );
  }

  /**
   * Сохранить токен в localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Получить текущего пользователя из localStorage
   */
  private getCurrentUserFromStorage(): User | null {
    const data = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!data) {
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      return this.normalizeUser(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Установить текущего пользователя
   */
  private setCurrentUser(user: User): void {
    const normalized = this.normalizeUser(user);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(normalized));
    this.currentUserSubject.next(normalized);
  }

  private normalizeUser(user: Partial<User>): User {
    return {
      id: user.id || '',
      name: user.name || '',
      type: user.type || 'user',
      identifier: user.identifier || user.email || '',
      email: user.email,
      createdAt: user.createdAt || new Date().toISOString()
    };
  }
}
