import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/services/api.service';
import { Claim, Policy, Customer } from '../shared/models/models';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div><div class="page-title">Claims</div><div class="page-subtitle">{{ claims().length }} total claims</div></div>
        <button class="btn btn-primary" (click)="openModal()">+ File Claim</button>
      </div>
      <div class="gold-line"></div>
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input class="search-input" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search by claim number or reason…" />
        </div>
        <select class="filter-select" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SETTLED">Settled</option>
        </select>
      </div>
      <div class="table-container">
        <div class="table-header"><div class="table-title">All Claims</div><div class="record-count">{{ filtered().length }} records</div></div>
        <div *ngIf="loading()" class="loading-wrap"><div class="spinner"></div></div>
        <div *ngIf="!loading() && filtered().length === 0" class="empty-state"><div class="empty-icon">⚡</div><div class="empty-text">No claims found</div></div>
        <table *ngIf="!loading() && filtered().length > 0">
          <thead><tr><th>Claim #</th><th>Policy</th><th>Amount</th><th>Reason</th><th>Status</th><th>Filed</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of filtered()">
              <td class="mono">{{ c.claimNumber }}</td>
              <td class="mono muted" style="font-size:12px">{{ c.policy?.policyNumber || '—' }}</td>
              <td class="mono">{{ fmt(c.claimAmount) }}</td>
              <td class="muted">{{ truncate(c.reason, 35) }}</td>
              <td><span class="badge badge-{{ c.status }}">{{ c.status }}</span></td>
              <td class="muted" style="font-size:12px">{{ fmtDate(c.createdAt) }}</td>
              <td>
                <div class="action-group" *ngIf="c.status === 'PENDING'">
                  <button class="btn btn-sm btn-approve" (click)="updateStatus(c._id, 'APPROVED')" [disabled]="updatingId() === c._id">✓</button>
                  <button class="btn btn-sm btn-danger" (click)="updateStatus(c._id, 'REJECTED')" [disabled]="updatingId() === c._id">✕</button>
                </div>
                <button *ngIf="c.status === 'APPROVED'" class="btn btn-sm btn-settle" (click)="updateStatus(c._id, 'SETTLED')" [disabled]="updatingId() === c._id">Settle</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div *ngIf="showModal()" class="modal-overlay" (click)="onOverlay($event)">
        <div class="modal">
          <div class="modal-header"><h2 class="modal-title">File New Claim</h2><button class="modal-close" (click)="closeModal()">✕</button></div>
          <div class="modal-body">
            <div *ngIf="error()" class="alert alert-error">⚠ {{ error() }}</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Claim Number *</label><input class="form-input" [(ngModel)]="form.claimNumber" placeholder="CLM-2024-001" /></div>
              <div class="form-group"><label class="form-label">Claim Amount (₹) *</label><input class="form-input" type="number" [(ngModel)]="form.claimAmount" placeholder="25000" /></div>
              <div class="form-group"><label class="form-label">Policy *</label><select class="form-select" [(ngModel)]="form.policyId"><option value="">Select policy…</option><option *ngFor="let p of policies()" [value]="p._id">{{ p.policyNumber }} — {{ p.policyType }}</option></select></div>
              <div class="form-group"><label class="form-label">Raised By *</label><select class="form-select" [(ngModel)]="form.customerId"><option value="">Select customer…</option><option *ngFor="let c of customers()" [value]="c._id">{{ c.name }}</option></select></div>
              <div class="form-group"><label class="form-label">Reason *</label><textarea class="form-textarea" rows="3" [(ngModel)]="form.reason" placeholder="Describe the reason…" style="resize:vertical"></textarea></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="createClaim()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'File Claim' }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClaimsComponent implements OnInit {
  claims = signal<Claim[]>([]);
  policies = signal<Policy[]>([]);
  customers = signal<Customer[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  updatingId = signal<string | null>(null);
  search = signal('');
  statusFilter = signal('');

  form = { claimNumber: '', policyId: '', claimAmount: 0, reason: '', customerId: '' };

  filtered = computed(() =>
    this.claims().filter(c =>
      (!this.search() || c.claimNumber?.toLowerCase().includes(this.search().toLowerCase()) || c.reason?.toLowerCase().includes(this.search().toLowerCase())) &&
      (!this.statusFilter() || c.status === this.statusFilter())
    )
  );

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getClaims().subscribe({ next: c => { this.claims.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.api.getPolicies().subscribe({ next: p => this.policies.set(p), error: () => {} });
    this.api.getCustomers().subscribe({ next: c => this.customers.set(c), error: () => {} });
  }

  openModal() { this.form = { claimNumber: '', policyId: '', claimAmount: 0, reason: '', customerId: '' }; this.error.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  onOverlay(e: MouseEvent) { if ((e.target as Element).classList.contains('modal-overlay')) this.closeModal(); }

  createClaim() {
    this.saving.set(true); this.error.set('');
    this.api.createClaim(this.form).subscribe({
      next: () => { this.closeModal(); this.load(); this.saving.set(false); },
      error: (e: any) => { this.error.set(e.error?.message || 'Failed'); this.saving.set(false); }
    });
  }

  updateStatus(id: string, status: string) {
    this.updatingId.set(id);
    this.api.updateClaimStatus(id, status).subscribe({ next: () => { this.updatingId.set(null); this.load(); }, error: () => this.updatingId.set(null) });
  }

  fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
  fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  truncate(s: string, n: number) { return s?.length > n ? s.slice(0, n) + '…' : s; }
}
