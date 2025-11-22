/**
 * AI Credits Service - API calls for AI credits purchase
 */

import { apiRequest } from '@/shared/lib/api/client';

export interface AICreditsPricingTier {
  credits: number;
  price_usd: number;
}

export interface AICreditsPricingResponse {
  tiers: AICreditsPricingTier[];
}

export interface AICreditsPurchaseRequest {
  credits: number;
  payment_type: 'ai_credits';
}

export interface AICreditsPurchaseResponse {
  transaction_id: number;
  order_id: string;
  approval_url: string;
  credits: number;
  amount: number;
  status: string;
}

export const aiCreditsService = {
  /**
   * Get AI credits pricing from platform settings
   */
  getPricing: () =>
    apiRequest<AICreditsPricingResponse>('/api/v1/ai/credits/pricing', 'GET'),

  /**
   * Initiate AI credits purchase via PayPal
   */
  purchaseCredits: (data: AICreditsPurchaseRequest) =>
    apiRequest<AICreditsPurchaseResponse>('/api/v1/ai/credits/purchase', 'POST', data),
};
