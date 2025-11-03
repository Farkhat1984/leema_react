/**
 * Billing API Service
 *
 * @description API calls for billing, transactions, and payments
 */

import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type {
  ShopBalance,
  Transaction,
  TransactionsResponse,
  TransactionFilters,
  RentalSlot,
  TopUpPayload,
  TopUpResponse,
  PaymentCaptureResponse,
  RentProductPayload,
  RentProductResponse,
} from '../types';

/**
 * Get shop balance info
 */
export async function getShopBalance(): Promise<ShopBalance> {
  const data = await apiRequest<{ balance: ShopBalance }>(API_ENDPOINTS.SHOPS.ME);
  return data.balance;
}

/**
 * Get shop transactions with filters
 */
export async function getTransactions(
  filters?: TransactionFilters
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${API_ENDPOINTS.SHOPS.TRANSACTIONS}?${params.toString()}`;
  return apiRequest<TransactionsResponse>(url);
}

/**
 * Get active rental slots
 */
export async function getActiveRentals(): Promise<RentalSlot[]> {
  const data = await apiRequest<{ rentals: RentalSlot[] }>(
    `${API_ENDPOINTS.SHOPS.ME}/rentals`
  );
  return data.rentals;
}

/**
 * Initiate top-up payment (get PayPal redirect URL)
 */
export async function initiateTopUp(payload: TopUpPayload): Promise<TopUpResponse> {
  return apiRequest<TopUpResponse>(API_ENDPOINTS.PAYMENTS.SHOP_TOP_UP, 'POST', payload);
}

/**
 * Capture payment after PayPal redirect
 */
export async function capturePayment(token: string): Promise<PaymentCaptureResponse> {
  return apiRequest<PaymentCaptureResponse>(
    API_ENDPOINTS.PAYMENTS.CAPTURE_PAYMENT(token),
    'POST'
  );
}

/**
 * Rent a product slot
 */
export async function rentProductSlot(
  payload: RentProductPayload
): Promise<RentProductResponse> {
  return apiRequest<RentProductResponse>(
    API_ENDPOINTS.PAYMENTS.SHOP_RENT_PRODUCT,
    'POST',
    payload
  );
}
