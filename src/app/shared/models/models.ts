export interface User {
  _id: string; name: string; email: string; role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
}
export interface Customer {
  _id: string; name: string; email: string; phone: string; address?: string; createdAt: string;
}
export interface Policy {
  _id: string; policyNumber: string; policyType: 'HEALTH' | 'MOTOR' | 'LIFE';
  premiumAmount: number; startDate: string; endDate: string; status: 'ACTIVE' | 'EXPIRED';
  isRenewed: boolean; renewalReminderSent: boolean; customer: Customer | null;
  issuedBy: User | null; createdAt: string;
}
export interface Claim {
  _id: string; claimNumber: string; policy: Policy | null; claimAmount: number;
  reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';
  raisedBy: Customer | null; createdAt: string;
}
export interface AuthResponse { token: string; user: User; }
