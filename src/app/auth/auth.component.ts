import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">Insure<span style="color:var(--indigo)">Flow</span></div>
          <div class="auth-tagline">by Sachin Dabas · Insurance Management Platform</div>
        </div>
        <div class="auth-body">
          <div class="auth-title">{{ mode() === 'login' ? 'Sign in to your account' : 'Create an account' }}</div>

          <div *ngIf="error()" class="alert alert-error">⚠ {{ error() }}</div>
          <div *ngIf="success()" class="alert alert-success">✓ {{ success() }}</div>

          <div class="form-grid">
            <div *ngIf="mode() === 'register'" class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" [(ngModel)]="form.name" placeholder="John Doe" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" [(ngModel)]="form.email" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" type="password" [(ngModel)]="form.password" placeholder="••••••••" />
            </div>
            <div *ngIf="mode() === 'register'" class="form-group">
              <label class="form-label">Role</label>
              <select class="form-select" [(ngModel)]="form.role">
                <option value="ADMIN">Admin</option>
                <option value="AGENT">Agent</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>
            <button class="btn btn-primary" style="width:100%;justify-content:center"
              (click)="submit()" [disabled]="loading()">
              <span *ngIf="loading()">Processing…</span>
              <span *ngIf="!loading()">{{ mode() === 'login' ? 'Sign In' : 'Create Account' }}</span>
            </button>
          </div>

          <div class="auth-toggle">
            <ng-container *ngIf="mode() === 'login'">
              Don't have an account? <span (click)="switchMode('register')">Register</span>
            </ng-container>
            <ng-container *ngIf="mode() === 'register'">
              Already have an account? <span (click)="switchMode('login')">Sign in</span>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal('');
  success = signal('');

  form = { name: '', email: '', password: '', role: 'AGENT' };

  constructor(private auth: AuthService, private router: Router) {}

  switchMode(m: 'login' | 'register') {
    this.mode.set(m);
    this.error.set('');
    this.success.set('');
  }

  submit() {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    if (this.mode() === 'login') {
      this.auth.login(this.form.email, this.form.password).subscribe({
        next: () => this.router.navigate(['/']),
        error: (e) => { this.error.set(e.error?.message || 'Login failed'); this.loading.set(false); }
      });
    } else {
      this.auth.register(this.form.name, this.form.email, this.form.password, this.form.role).subscribe({
        next: () => { this.success.set('Account created! Please log in.'); this.switchMode('login'); this.loading.set(false); },
        error: (e) => { this.error.set(e.error?.message || 'Registration failed'); this.loading.set(false); }
      });
    }
  }
}
