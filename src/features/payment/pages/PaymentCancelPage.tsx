/**
 * Payment Cancel Page
 * Displayed when user cancels payment or payment fails
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/config';
import { Button } from '@/shared/components/ui/Button';
import { XCircle, AlertCircle } from 'lucide-react';

function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reason = searchParams.get('reason') || 'Payment was cancelled';
  const paymentType = searchParams.get('type') || 'topup';

  /**
   * Handle retry payment
   */
  const handleRetry = () => {
    if (paymentType === 'topup') {
      navigate(ROUTES.SHOP.BILLING_TOPUP);
    } else if (paymentType === 'order') {
      navigate(ROUTES.SHOP.ORDERS);
    } else {
      navigate(ROUTES.SHOP.BILLING);
    }
  };

  /**
   * Handle return to dashboard
   */
  const handleReturnToDashboard = () => {
    navigate(ROUTES.SHOP.DASHBOARD);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-red-200">
        {/* Cancel Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">Your payment was not completed</p>
        </div>

        {/* Reason Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900 mb-1">What happened?</p>
            <p className="text-sm text-yellow-800">{reason}</p>
          </div>
        </div>

        {/* Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">No charges were made</h3>
          <p className="text-sm text-gray-600 mb-3">
            Your payment was not processed and no money was deducted from your account.
          </p>
          <p className="text-sm text-gray-600">
            {paymentType === 'topup' && 'Your balance remains unchanged. You can try again or choose a different payment method.'}
            {paymentType === 'order' && 'Your order was not completed. You can try placing the order again.'}
            {paymentType === 'rent' && 'Your rental was not activated. You can try again to rent a product slot.'}
          </p>
        </div>

        {/* Common Reasons */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">Common reasons for cancellation:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Payment window was closed</li>
            <li>Insufficient funds in account</li>
            <li>Payment details were incorrect</li>
            <li>Transaction timed out</li>
            <li>User cancelled the payment</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            variant="primary"
            className="w-full"
          >
            Try Again
          </Button>
          <Button
            onClick={handleReturnToDashboard}
            variant="outline"
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>

        {/* Help Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Need help with your payment?</p>
          <Button
            onClick={() => window.open('mailto:support@leema.kz', '_blank')}
            variant="ghost"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
