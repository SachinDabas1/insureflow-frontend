import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-text">Insure<span class="logo-accent">Flow</span></div>
          <div class="logo-badge">by Sachin Dabas</div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Main</div>
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <span class="nav-icon">⬡</span> Dashboard
          </a>
          <a class="nav-item" routerLink="/customers" routerLinkActive="active">
            <span class="nav-icon">👥</span> Customers
          </a>
          <a class="nav-item" routerLink="/policies" routerLinkActive="active">
            <span class="nav-icon">📋</span> Policies
          </a>
          <a class="nav-item" routerLink="/claims" routerLinkActive="active">
            <span class="nav-icon">⚡</span> Claims
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ user()?.name }}</div>
              <div class="user-role">{{ user()?.role }}</div>
            </div>
            <button class="logout-btn" (click)="logout()" title="Sign out">⏻</button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `
})
export class ShellComponent {
  user = this.auth.currentUser;

  initials = computed(() => {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor(private auth: AuthService) {}

  logout() { this.auth.logout(); }
}
