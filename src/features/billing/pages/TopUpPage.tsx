/**
 * Top-Up Page
 *
 * @description Page for topping up shop balance via PayPal
 * @route /shop/billing/topup
 */

import { useState } from 'react';
import { formatNumber } from '@/shared/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInitiateTopUp } from '../hooks/useBilling';
import { Button } from '@/shared/components/ui/Button';
import { FormInput } from '@/shared/components/forms/FormInput';
import { topUpSchema, type TopUpFormData } from '@/shared/lib/validation/schemas';

const PRESET_AMOUNTS = [1000, 5000, 10000, 50000, 100000];

export function TopUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TopUpFormData>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      payment_method: 'paypal',
      amount: undefined,
    },
  });

  const amount = watch('amount');
  const paymentMethod = watch('payment_method');

  const initiateMutation = useInitiateTopUp();

  const handlePresetClick = (presetAmount: number) => {
    setSelectedAmount(presetAmount);
    setValue('amount', presetAmount, { shouldValidate: true });
  };

  const onSubmit = (data: TopUpFormData) => {
    const returnUrl = `${window.location.origin}/payment/success?type=topup`;
    const cancelUrl = `${window.location.origin}/payment/cancel?type=topup`;

    initiateMutation.mutate({
      amount: data.amount,
      payment_method: data.payment_method,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/shop/billing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Up Balance</h1>
          <p className="text-gray-600">
            Add funds to your shop balance to rent product slots and manage your shop
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Amount Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Amount
              </label>

              {/* Preset Amounts */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      selectedAmount === preset
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {preset.toLocaleString()} ₸
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <FormInput
                label="Or enter custom amount (KZT)"
                type="number"
                placeholder="Enter amount"
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
              />

              {amount && (
                <div className="mt-2 text-sm text-gray-600">
                  You will pay: <span className="font-semibold">{formatNumber(amount)} KZT</span>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Payment Method
              </label>

              <div className="space-y-3">
                {/* PayPal Option */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value="paypal"
                    {...register('payment_method')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                      alt="PayPal"
                      className="w-8 h-8"
                    />
                    <div>
                      <div className="font-medium text-gray-900">PayPal</div>
                      <div className="text-sm text-gray-500">
                        Safe and secure payment via PayPal
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'paypal' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  )}
                </label>

                {/* Card Option (Coming Soon) */}
                <label
                  className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                >
                  <input
                    type="radio"
                    value="card"
                    disabled
                    className="w-4 h-4 text-gray-400"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-600">Credit/Debit Card</div>
                      <div className="text-sm text-gray-500">Coming soon</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Payment Information</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>You will be redirected to PayPal to complete the payment</li>
                    <li>Funds will be added to your balance immediately after payment</li>
                    <li>All transactions are secure and encrypted</li>
                    <li>Minimum top-up amount: 100 KZT</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!amount || initiateMutation.isPending}
              isLoading={initiateMutation.isPending}
            >
              {initiateMutation.isPending ? 'Redirecting to PayPal...' : 'Proceed to Payment'}
            </Button>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Secure payment powered by PayPal</p>
        </div>
      </div>
    </div>
  );
}

export default TopUpPage;
