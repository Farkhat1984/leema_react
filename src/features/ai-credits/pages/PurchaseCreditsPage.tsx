/**
 * AI Credits Purchase Page
 *
 * @description Page for purchasing AI credits via PayPal
 * @route /user/credits/purchase
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { aiCreditsService } from '../services/ai-credits.service';
import toast from 'react-hot-toast';

export function PurchaseCreditsPage() {
  const navigate = useNavigate();
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);

  // Fetch pricing from backend
  const { data: pricingData, isLoading: isPricingLoading } = useQuery({
    queryKey: ['ai-credits', 'pricing'],
    queryFn: aiCreditsService.getPricing,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: aiCreditsService.purchaseCredits,
    onSuccess: (data) => {
      // Redirect to PayPal
      window.location.href = data.approval_url;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось создать платёж');
    },
  });

  const handlePurchase = (credits: number) => {
    setSelectedCredits(credits);
    purchaseMutation.mutate({
      credits,
      payment_type: 'ai_credits',
    });
  };

  if (isPricingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  const tiers = pricingData?.tiers || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Покупка AI кредитов
            </h1>
            <p className="text-gray-600">
              Выберите пакет кредитов для использования AI функций платформы
            </p>
          </div>
          <BackButton to="/user/dashboard" />
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier, index) => {
            const isPopular = index === 1; // Middle tier is popular
            const isPurchasing = purchaseMutation.isPending && selectedCredits === tier.credits;

            return (
              <div
                key={tier.credits}
                className={`relative bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                  isPopular
                    ? 'border-purple-500 shadow-purple-100'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Популярно
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.credits} кредитов
                  </h3>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    ${tier.price_usd}
                  </div>
                  <p className="text-sm text-gray-500">
                    ~${(tier.price_usd / tier.credits).toFixed(3)} за кредит
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    {tier.credits} AI генераций
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    Виртуальная примерка
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    Создание образов
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    Без срока действия
                  </li>
                </ul>

                <Button
                  onClick={() => handlePurchase(tier.credits)}
                  disabled={isPurchasing}
                  isLoading={isPurchasing}
                  className={`w-full ${
                    isPopular
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isPurchasing ? 'Переход к оплате...' : 'Купить'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <img
              src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
              alt="PayPal"
              className="w-12 h-12"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Безопасная оплата через PayPal
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                После нажатия кнопки "Купить" вы будете перенаправлены на защищенную страницу
                оплаты PayPal. Кредиты будут добавлены на ваш счет сразу после успешной оплаты.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>256-битное шифрование SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Важная информация</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>1 кредит = 1 AI генерация (примерка, создание образа)</li>
                <li>Кредиты не имеют срока действия</li>
                <li>Средства не возвращаются после покупки</li>
                <li>Дополнительно: {tiers[0]?.credits || 5} бесплатных запросов в день</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Все транзакции защищены и зашифрованы</p>
        </div>
      </div>
    </div>
  );
}

export default PurchaseCreditsPage;
