import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../shared/services/auth.service';
import { Policy, Claim } from '../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <div class="page-title">Welcome back, {{ firstName() }} ✦</div>
          <div class="page-subtitle">Here's your insurance portfolio overview</div>
        </div>
        <span class="badge badge-{{ user()?.role }}">{{ user()?.role }}</span>
      </div>
      <div class="gold-line"></div>
      <div class="stats-grid">
        <div class="stat-card gold"><span class="stat-icon">👥</span><div class="stat-value">{{ stats().customers }}</div><div class="stat-label">Total Customers</div></div>
        <div class="stat-card jade"><span class="stat-icon">📋</span><div class="stat-value">{{ stats().policies }}</div><div class="stat-label">Policies Issued</div></div>
        <div class="stat-card sky"><span class="stat-icon">⚡</span><div class="stat-value">{{ stats().claims }}</div><div class="stat-label">Claims Filed</div></div>
        <div class="stat-card crimson"><span class="stat-icon">₹</span><div class="stat-value">{{ fmtRevenue() }}</div><div class="stat-label">Premium Revenue</div></div>
      </div>
      <div class="grid-2-1">
        <div class="card">
          <div class="card-title">Recent Policies</div>
          <div *ngIf="recentPolicies().length === 0" class="empty-state" style="padding:24px"><div class="empty-text">No policies yet</div></div>
          <table *ngIf="recentPolicies().length > 0">
            <thead><tr><th>Policy #</th><th>Type</th><th>Premium</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of recentPolicies()">
                <td class="mono">{{ p.policyNumber }}</td>
                <td><span class="badge badge-{{ p.policyType }}">{{ p.policyType }}</span></td>
                <td class="mono">{{ fmt(p.premiumAmount) }}</td>
                <td><span class="badge badge-{{ p.status }}">{{ p.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-title">Policy Mix</div>
          <div *ngFor="let item of progressItems()" class="progress-row">
            <div class="progress-label"><span>{{ item.label }}</span><span>{{ item.pct }}%</span></div>
            <div class="progress-track"><div class="progress-fill" [style.width]="item.pct + '%'" [style.background]="item.color"></div></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Recent Claims</div>
        <div *ngIf="recentClaims().length === 0" class="empty-state" style="padding:24px"><div class="empty-text">No claims yet</div></div>
        <table *ngIf="recentClaims().length > 0">
          <thead><tr><th>Claim #</th><th>Amount</th><th>Reason</th><th>Status</th><th>Filed</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of recentClaims()">
              <td class="mono">{{ c.claimNumber }}</td>
              <td class="mono">{{ fmt(c.claimAmount) }}</td>
              <td class="muted">{{ truncate(c.reason, 40) }}</td>
              <td><span class="badge badge-{{ c.status }}">{{ c.status }}</span></td>
              <td class="muted" style="font-size:12px">{{ fmtDate(c.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  user = this.auth.currentUser;
  stats = signal({ customers: 0, policies: 0, claims: 0, revenue: 0 });
  recentPolicies = signal<Policy[]>([]);
  recentClaims = signal<Claim[]>([]);
  progressItems = signal([
    { label: 'Health', pct: 0, color: 'var(--jade)' },
    { label: 'Motor', pct: 0, color: 'var(--sky)' },
    { label: 'Life', pct: 0, color: 'var(--gold)' },
  ]);

  firstName = () => this.auth.currentUser()?.name?.split(' ')[0] || '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getCustomers().subscribe({ next: c => this.stats.update(s => ({ ...s, customers: c.length })), error: () => {} });
    this.api.getPolicies().subscribe({
      next: p => {
        const total = p.length || 1;
        const health = p.filter((x: any) => x.policyType === 'HEALTH').length;
        const motor = p.filter((x: any) => x.policyType === 'MOTOR').length;
        const life = p.filter((x: any) => x.policyType === 'LIFE').length;
        this.stats.update(s => ({ ...s, policies: p.length, revenue: p.reduce((a: number, pol: any) => a + pol.premiumAmount, 0) }));
        this.recentPolicies.set(p.slice(0, 5));
        this.progressItems.set([
          { label: 'Health', pct: Math.round(health / total * 100), color: 'var(--jade)' },
          { label: 'Motor', pct: Math.round(motor / total * 100), color: 'var(--sky)' },
          { label: 'Life', pct: Math.round(life / total * 100), color: 'var(--gold)' },
        ]);
      },
      error: () => {}
    });
    this.api.getClaims().subscribe({ next: c => { this.stats.update(s => ({ ...s, claims: c.length })); this.recentClaims.set(c.slice(0, 5)); }, error: () => {} });
  }

  fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
  fmtRevenue() { return this.fmt(this.stats().revenue); }
  fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  truncate(s: string, n: number) { return s?.length > n ? s.slice(0, n) + '…' : s; }
}