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

  const reason = searchParams.get('reason') || 'Платеж был отменен';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Платеж отменен</h1>
          <p className="text-gray-600">Ваш платеж не был завершен</p>
        </div>

        {/* Reason Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900 mb-1">Что произошло?</p>
            <p className="text-sm text-yellow-800">{reason}</p>
          </div>
        </div>

        {/* Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Средства не списаны</h3>
          <p className="text-sm text-gray-600 mb-3">
            Ваш платеж не был обработан, и деньги не были списаны с вашего счета.
          </p>
          <p className="text-sm text-gray-600">
            {paymentType === 'topup' && 'Ваш баланс остался без изменений. Вы можете попробовать снова или выбрать другой способ оплаты.'}
            {paymentType === 'order' && 'Ваш заказ не был завершен. Вы можете попробовать оформить заказ снова.'}
            {paymentType === 'rent' && 'Ваша аренда не была активирована. Вы можете попробовать снова арендовать слот для товара.'}
          </p>
        </div>

        {/* Common Reasons */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">Частые причины отмены:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Окно оплаты было закрыто</li>
            <li>Недостаточно средств на счете</li>
            <li>Неверные данные платежа</li>
            <li>Истекло время транзакции</li>
            <li>Пользователь отменил платеж</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            variant="primary"
            className="w-full"
          >
            Попробовать снова
          </Button>
          <Button
            onClick={handleReturnToDashboard}
            variant="outline"
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </div>

        {/* Help Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Нужна помощь с платежом?</p>
          <Button
            onClick={() => window.open('mailto:support@leema.kz', '_blank')}
            variant="ghost"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Связаться с поддержкой
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
