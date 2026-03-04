import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/services/api.service';
import { Policy, Customer } from '../shared/models/models';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div><div class="page-title">Policies</div><div class="page-subtitle">{{ policies().length }} total policies</div></div>
        <button class="btn btn-primary" (click)="openModal()">+ Issue Policy</button>
      </div>
      <div class="gold-line"></div>
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input class="search-input" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search by policy number…" />
        </div>
        <select class="filter-select" [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
          <option value="">All Types</option>
          <option value="HEALTH">Health</option>
          <option value="MOTOR">Motor</option>
          <option value="LIFE">Life</option>
        </select>
      </div>
      <div class="table-container">
        <div class="table-header"><div class="table-title">All Policies</div><div class="record-count">{{ filtered().length }} records</div></div>
        <div *ngIf="loading()" class="loading-wrap"><div class="spinner"></div></div>
        <div *ngIf="!loading() && filtered().length === 0" class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No policies found</div></div>
        <table *ngIf="!loading() && filtered().length > 0">
          <thead><tr><th>Policy #</th><th>Type</th><th>Customer</th><th>Premium</th><th>Start</th><th>End</th><th>Status</th><th>Renewed</th></tr></thead>
          <tbody>
            <tr *ngFor="let p of filtered()">
              <td class="mono">{{ p.policyNumber }}</td>
              <td><span class="badge badge-{{ p.policyType }}">{{ p.policyType }}</span></td>
              <td style="font-weight:500">{{ p.customer?.name || '—' }}</td>
              <td class="mono">{{ fmt(p.premiumAmount) }}</td>
              <td class="muted" style="font-size:12px">{{ fmtDate(p.startDate) }}</td>
              <td class="muted" style="font-size:12px">{{ fmtDate(p.endDate) }}</td>
              <td><span class="badge badge-{{ p.status }}">{{ p.status }}</span></td>
              <td><span *ngIf="p.isRenewed" style="color:var(--jade)">✓</span><span *ngIf="!p.isRenewed" class="muted">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="showModal()" class="modal-overlay" (click)="onOverlay($event)">
        <div class="modal">
          <div class="modal-header"><h2 class="modal-title">Issue New Policy</h2><button class="modal-close" (click)="closeModal()">✕</button></div>
          <div class="modal-body">
            <div *ngIf="error()" class="alert alert-error">⚠ {{ error() }}</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Policy Number *</label><input class="form-input" [(ngModel)]="form.policyNumber" placeholder="POL-2024-001" /></div>
              <div class="form-group"><label class="form-label">Policy Type *</label><select class="form-select" [(ngModel)]="form.policyType"><option value="HEALTH">Health</option><option value="MOTOR">Motor</option><option value="LIFE">Life</option></select></div>
              <div class="form-group"><label class="form-label">Customer *</label><select class="form-select" [(ngModel)]="form.customerId"><option value="">Select customer…</option><option *ngFor="let c of customers()" [value]="c._id">{{ c.name }}</option></select></div>
              <div class="form-group"><label class="form-label">Premium Amount (₹) *</label><input class="form-input" type="number" [(ngModel)]="form.premiumAmount" placeholder="50000" /></div>
              <div class="form-group"><label class="form-label">Start Date *</label><input class="form-input" type="date" [(ngModel)]="form.startDate" /></div>
              <div class="form-group"><label class="form-label">End Date *</label><input class="form-input" type="date" [(ngModel)]="form.endDate" /></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="createPolicy()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Issue Policy' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PoliciesComponent implements OnInit {
  policies = signal<Policy[]>([]);
  customers = signal<Customer[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  search = signal('');
  typeFilter = signal('');

  form = { policyNumber: '', policyType: 'HEALTH', premiumAmount: 0, startDate: '', endDate: '', customerId: '' };

  filtered = computed(() =>
    this.policies().filter(p =>
      (!this.search() || p.policyNumber?.toLowerCase().includes(this.search().toLowerCase())) &&
      (!this.typeFilter() || p.policyType === this.typeFilter())
    )
  );

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getPolicies().subscribe({ next: p => { this.policies.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.api.getCustomers().subscribe({ next: c => this.customers.set(c), error: () => {} });
  }

  openModal() { this.form = { policyNumber: '', policyType: 'HEALTH', premiumAmount: 0, startDate: '', endDate: '', customerId: '' }; this.error.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  onOverlay(e: MouseEvent) { if ((e.target as Element).classList.contains('modal-overlay')) this.closeModal(); }

  createPolicy() {
    this.saving.set(true); this.error.set('');
    this.api.createPolicy(this.form).subscribe({
      next: () => { this.closeModal(); this.load(); this.saving.set(false); },
      error: (e: any) => { this.error.set(e.error?.message || 'Failed'); this.saving.set(false); }
    });
  }

  fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
  fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
}
