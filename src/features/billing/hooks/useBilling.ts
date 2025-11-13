/**
 * Billing Hooks
 *
 * @description React Query hooks for billing operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getShopBalance,
  getTransactions,
  getActiveRentals,
  initiateTopUp,
  capturePayment,
  rentProductSlot,
} from '../services/billing-api';
import type { TransactionFilters, TopUpPayload, RentProductPayload } from '../types';
import { getErrorMessage } from '@/shared/types/errors';

const QUERY_KEYS = {
  balance: ['billing', 'balance'] as const,
  transactions: (filters?: TransactionFilters) => ['billing', 'transactions', filters] as const,
  rentals: ['billing', 'rentals'] as const,
};

/**
 * Get shop balance
 */
export function useShopBalance() {
  return useQuery({
    queryKey: QUERY_KEYS.balance,
    queryFn: getShopBalance,
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: 'always',
  });
}

/**
 * Get transactions with filters
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters),
    queryFn: () => getTransactions(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get active rentals
 */
export function useActiveRentals() {
  return useQuery({
    queryKey: QUERY_KEYS.rentals,
    queryFn: getActiveRentals,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Initiate top-up payment
 */
export function useInitiateTopUp() {
  return useMutation({
    mutationFn: (payload: TopUpPayload) => initiateTopUp(payload),
    onSuccess: (response) => {
      // Redirect to PayPal
      window.location.href = response.approval_url;
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to initiate payment');
    },
  });
}

/**
 * Capture payment after redirect
 */
export function useCapturePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => capturePayment(token),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.balance });

      // Snapshot the previous balance
      const previousBalance = queryClient.getQueryData(QUERY_KEYS.balance);

      // Optimistically show loading state
      // The actual balance will be updated on success

      return { previousBalance };
    },
    onSuccess: (response) => {
      toast.success(`Payment successful! New balance: ${response.new_balance} KZT`);

      // Optimistically update balance
      queryClient.setQueryData(QUERY_KEYS.balance, response);

      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['billing', 'transactions'] });
    },
    onError: (error: unknown, _token, context) => {
      toast.error(getErrorMessage(error) || 'Payment capture failed');

      // Rollback to previous balance on error
      if (context?.previousBalance) {
        queryClient.setQueryData(QUERY_KEYS.balance, context.previousBalance);
      }
    },
    onSettled: () => {
      // Always refetch balance after mutation completes (success or error)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.balance });
    },
  });
}

/**
 * Rent product slot
 */
export function useRentProductSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RentProductPayload) => rentProductSlot(payload),
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.balance });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.rentals });

      // Snapshot previous data
      const previousBalance = queryClient.getQueryData(QUERY_KEYS.balance);
      const previousRentals = queryClient.getQueryData(QUERY_KEYS.rentals);

      // Optimistically update balance (deduct rental cost)
      const currentBalance = previousBalance as { balance: number; currency: string } | undefined;
      if (currentBalance) {
        queryClient.setQueryData(QUERY_KEYS.balance, {
          ...currentBalance,
          balance: currentBalance.balance - payload.price,
        });
      }

      // Optimistically add rental to active rentals
      const currentRentals = (previousRentals as Array<unknown>) || [];
      const optimisticRental = {
        id: `temp-${Date.now()}`,
        product_id: payload.product_id,
        duration_months: payload.duration_months,
        price: payload.price,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + payload.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      };
      queryClient.setQueryData(QUERY_KEYS.rentals, [...currentRentals, optimisticRental]);

      return { previousBalance, previousRentals };
    },
    onSuccess: (response) => {
      toast.success('Product slot rented successfully!');

      // Update with real data from server
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rentals });
      queryClient.invalidateQueries({ queryKey: ['billing', 'transactions'] });
    },
    onError: (error: unknown, _payload, context) => {
      toast.error(getErrorMessage(error) || 'Failed to rent product slot');

      // Rollback optimistic updates
      if (context?.previousBalance) {
        queryClient.setQueryData(QUERY_KEYS.balance, context.previousBalance);
      }
      if (context?.previousRentals) {
        queryClient.setQueryData(QUERY_KEYS.rentals, context.previousRentals);
      }
    },
    onSettled: () => {
      // Ensure fresh data after mutation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.balance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rentals });
    },
  });
}
