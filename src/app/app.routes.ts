import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'customers', loadComponent: () => import('./customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'policies', loadComponent: () => import('./policies/policies.component').then(m => m.PoliciesComponent) },
      { path: 'claims', loadComponent: () => import('./claims/claims.component').then(m => m.ClaimsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
