import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../shared/services/api.service';
import { AuthService } from '../shared/services/auth.service';
import { Customer } from '../shared/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div><div class="page-title">Customers</div><div class="page-subtitle">{{ customers().length }} total accounts</div></div>
        <button class="btn btn-primary" (click)="openModal()">+ Add Customer</button>
      </div>
      <div class="gold-line"></div>
      <div class="search-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input class="search-input" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search by name, email, phone…" />
        </div>
      </div>
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">All Customers</div>
          <div class="record-count">{{ filtered().length }} records</div>
        </div>
        <div *ngIf="loading()" class="loading-wrap"><div class="spinner"></div></div>
        <div *ngIf="!loading() && filtered().length === 0" class="empty-state">
          <div class="empty-icon">👥</div><div class="empty-text">No customers found</div>
        </div>
        <table *ngIf="!loading() && filtered().length > 0">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Created</th><th *ngIf="isAdmin()">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of filtered()">
              <td><div class="cell-name"><div class="cell-avatar">{{ initials(c.name) }}</div><span style="font-weight:500">{{ c.name }}</span></div></td>
              <td class="muted">{{ c.email }}</td>
              <td class="mono">{{ c.phone }}</td>
              <td class="muted">{{ c.address || '—' }}</td>
              <td class="muted" style="font-size:12px">{{ fmtDate(c.createdAt) }}</td>
              <td *ngIf="isAdmin()"><button class="btn btn-danger btn-sm" (click)="confirmDelete(c._id)">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="showModal()" class="modal-overlay" (click)="onOverlay($event)">
        <div class="modal">
          <div class="modal-header"><h2 class="modal-title">Add New Customer</h2><button class="modal-close" (click)="closeModal()">✕</button></div>
          <div class="modal-body">
            <div *ngIf="error()" class="alert alert-error">⚠ {{ error() }}</div>
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" [(ngModel)]="form.name" placeholder="John Doe" /></div>
              <div class="form-group"><label class="form-label">Email *</label><input class="form-input" type="email" [(ngModel)]="form.email" placeholder="john@email.com" /></div>
              <div class="form-group"><label class="form-label">Phone *</label><input class="form-input" [(ngModel)]="form.phone" placeholder="+91 98765 43210" /></div>
              <div class="form-group"><label class="form-label">Address</label><input class="form-input" [(ngModel)]="form.address" placeholder="123 Main St" /></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="createCustomer()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Create Customer' }}</button>
          </div>
        </div>
      </div>

      <div *ngIf="deleteId()" class="modal-overlay" (click)="onOverlay($event)">
        <div class="modal">
          <div class="modal-header"><h2 class="modal-title">Confirm Delete</h2><button class="modal-close" (click)="deleteId.set(null)">✕</button></div>
          <div class="modal-body"><p style="color:var(--text-2)">Are you sure? This cannot be undone.</p></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="deleteId.set(null)">Cancel</button>
            <button class="btn btn-danger" (click)="deleteCustomer()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  loading = signal(true);
  search = signal('');
  showModal = signal(false);
  saving = signal(false);
  error = signal('');
  deleteId = signal<string | null>(null);
  form = { name: '', email: '', phone: '', address: '' };

  filtered = computed(() =>
    this.customers().filter(c =>
      !this.search() ||
      c.name?.toLowerCase().includes(this.search().toLowerCase()) ||
      c.email?.toLowerCase().includes(this.search().toLowerCase()) ||
      c.phone?.includes(this.search())
    )
  );

  isAdmin = () => this.auth.currentUser()?.role === 'ADMIN';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getCustomers().subscribe({ next: c => { this.customers.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openModal() { this.form = { name: '', email: '', phone: '', address: '' }; this.error.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  onOverlay(e: MouseEvent) { if ((e.target as Element).classList.contains('modal-overlay')) { this.showModal.set(false); this.deleteId.set(null); } }

  createCustomer() {
    this.saving.set(true); this.error.set('');
    this.api.createCustomer(this.form).subscribe({
      next: () => { this.closeModal(); this.load(); this.saving.set(false); },
      error: (e: any) => { this.error.set(e.error?.message || 'Failed'); this.saving.set(false); }
    });
  }

  confirmDelete(id: string) { this.deleteId.set(id); }

  deleteCustomer() {
    const id = this.deleteId();
    if (!id) return;
    this.api.deleteCustomer(id).subscribe({ next: () => { this.deleteId.set(null); this.load(); }, error: () => {} });
  }

  initials(name: string) { return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }
  fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
}
