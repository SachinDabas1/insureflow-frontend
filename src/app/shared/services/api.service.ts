import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Customer, Policy, Claim } from '../models/models';

const toArray = (r: any) => Array.isArray(r) ? r : (r?.data ?? r?.customers ?? r?.policies ?? r?.claims ?? r?.results ?? []);

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE = 'https://insureflow-backend.onrender.com/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.token()}` });
  }

  getCustomers() {
    return this.http.get<any>(`${this.BASE}/customers`, { headers: this.headers() }).pipe(map(toArray));
  }
  createCustomer(data: Partial<Customer>) {
    return this.http.post<Customer>(`${this.BASE}/customers`, data, { headers: this.headers() });
  }
  deleteCustomer(id: string) {
    return this.http.delete(`${this.BASE}/customers/${id}`, { headers: this.headers() });
  }

  getPolicies() {
    return this.http.get<any>(`${this.BASE}/policies`, { headers: this.headers() }).pipe(map(toArray));
  }
  createPolicy(data: any) {
    return this.http.post<Policy>(`${this.BASE}/policies`, data, { headers: this.headers() });
  }

  getClaims() {
    return this.http.get<any>(`${this.BASE}/claims`, { headers: this.headers() }).pipe(map(toArray));
  }
  createClaim(data: any) {
    return this.http.post<Claim>(`${this.BASE}/claims`, data, { headers: this.headers() });
  }
  updateClaimStatus(id: string, status: string) {
    return this.http.patch(`${this.BASE}/claims/${id}/status`, { status }, { headers: this.headers() });
  }
}
