/**
 * Payment Success Page
 * Displayed after successful payment (top-up, order payment)
 */

import { useEffect, useState } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { formatNumber } from '@/shared/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { CheckCircle } from 'lucide-react';

type PaymentDetails = {
  paymentId: string;
  amount: number;
  currency: string;
  type: 'topup' | 'order' | 'rent';
  orderId?: string;
  timestamp: string;
};

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    capturePayment();
  }, []);

  /**
   * Capture payment from PayPal/Payment provider
   */
  const capturePayment = async () => {
    try {
      const token = searchParams.get('token') || searchParams.get('paymentId');
      const paymentType = searchParams.get('type') || 'topup';

      if (!token) {
        throw new Error('Payment token not found');
      }

      // Call backend to capture payment (token is in the URL path)
      const response = await apiRequest<PaymentDetails>(
        API_ENDPOINTS.PAYMENTS.CAPTURE_PAYMENT(token),
        'POST'
      );

      setPaymentDetails(response);
      setIsProcessing(false);
    } catch (err: unknown) {
      logger.error('Payment capture error', err);
      setError(err.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  /**
   * Handle continue action
   */
  const handleContinue = () => {
    if (paymentDetails?.type === 'topup') {
      navigate(ROUTES.SHOP.BILLING);
    } else if (paymentDetails?.type === 'order' && paymentDetails.orderId) {
      navigate(ROUTES.SHOP.ORDERS);
    } else {
      navigate(ROUTES.SHOP.DASHBOARD);
    }
  };

  // Processing state
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner className="w-12 h-12 text-purple-600 mx-auto mb-5" />
          <p className="text-lg text-gray-700">Processing your payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg border border-red-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing Failed</h2>
            <p className="text-gray-600">{error}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(ROUTES.SHOP.BILLING)}
              variant="primary"
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate(ROUTES.SHOP.DASHBOARD)}
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-green-200">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-once">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your payment has been processed successfully</p>
        </div>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount</span>
              <span className="text-xl font-bold text-gray-900">
                {formatNumber(paymentDetails.amount)} {paymentDetails.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment ID</span>
              <span className="text-sm font-mono text-gray-700">{paymentDetails.paymentId}</span>
            </div>
            {paymentDetails.orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order ID</span>
                <span className="text-sm font-mono text-gray-700">{paymentDetails.orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date</span>
              <span className="text-sm text-gray-700">
                {new Date(paymentDetails.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            {paymentDetails?.type === 'topup' && 'Your balance has been updated. You can now use it to rent product slots or make other purchases.'}
            {paymentDetails?.type === 'order' && 'Your order has been confirmed and will be processed shortly.'}
            {paymentDetails?.type === 'rent' && 'Your product slot rental has been activated.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            variant="primary"
            className="w-full"
          >
            Continue
          </Button>
          <Button
            onClick={() => navigate(ROUTES.SHOP.DASHBOARD)}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>A confirmation email has been sent to your registered email address</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
