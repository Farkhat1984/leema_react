/**
 * Billing & Payments Types
 *
 * @description TypeScript types for shop billing, transactions, and payments
 */

export type TransactionType = 'top-up' | 'rent' | 'refund' | 'withdrawal' | 'purchase';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string | number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  status: TransactionStatus;
  description: string;
  created_at: string;
  reference?: string; // PayPal transaction ID, etc.
}

export interface RentalSlot {
  id: string | number;
  slot_number: number;
  product_id: string | number | null;
  product_name?: string;
  start_date: string;
  expiration_date: string;
  days_remaining: number;
  is_active: boolean;
  price_per_month: number;
}

export interface ShopBalance {
  current_balance: number;
  pending_balance: number;
  currency: string;
  active_rentals_count: number;
  total_spent: number;
  total_earned: number;
}

export interface TopUpPayload {
  amount: number;
  payment_method: 'paypal' | 'card';
  return_url: string;
  cancel_url: string;
}

export interface TopUpResponse {
  payment_url: string;
  transaction_id: string;
  expires_at: string;
}

export interface PaymentCaptureResponse {
  success: boolean;
  transaction_id: string;
  amount: number;
  new_balance: number;
  message: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface RentProductPayload {
  product_id: string | number;
  duration_months: 1 | 3 | 6 | 12;
}

export interface RentProductResponse {
  rental_slot: RentalSlot;
  new_balance: number;
  transaction_id: string;
}
