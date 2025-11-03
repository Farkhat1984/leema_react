/**
 * Billing Feature Module
 *
 * @description Exports for billing and payments feature
 */

// Pages
export { BillingPage } from './pages/BillingPage';
export { TopUpPage } from './pages/TopUpPage';

// Components
export { ActiveRentals } from './components/ActiveRentals';
export { TransactionHistory } from './components/TransactionHistory';

// Hooks
export {
  useShopBalance,
  useTransactions,
  useActiveRentals,
  useInitiateTopUp,
  useCapturePayment,
  useRentProductSlot,
} from './hooks/useBilling';

// Services
export {
  getShopBalance,
  getTransactions,
  getActiveRentals,
  initiateTopUp,
  capturePayment,
  rentProductSlot,
} from './services/billing-api';

// Types
export type {
  Transaction,
  TransactionType,
  TransactionStatus,
  RentalSlot,
  ShopBalance,
  TopUpPayload,
  TopUpResponse,
  PaymentCaptureResponse,
  TransactionFilters,
  TransactionsResponse,
  RentProductPayload,
  RentProductResponse,
} from './types';
