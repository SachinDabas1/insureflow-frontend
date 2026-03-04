import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:5001/api';
  currentUser = signal<User | null>(this.loadUser());
  token = signal<string | null>(sessionStorage.getItem('if_token'));

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): User | null {
    try { const u = sessionStorage.getItem('if_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/auth/login`, { email, password }).pipe(
      tap(res => {
        sessionStorage.setItem('if_token', res.token);
        sessionStorage.setItem('if_user', JSON.stringify(res.user));
        this.token.set(res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  register(name: string, email: string, password: string, role: string) {
    return this.http.post(`${this.API}/auth/register`, { name, email, password, role });
  }

  logout() {
    sessionStorage.clear(); this.token.set(null); this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return !!this.token(); }
}
