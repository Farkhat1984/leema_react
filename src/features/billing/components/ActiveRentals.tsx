/**
 * Active Rentals Component
 *
 * @description Displays active product slot rentals with expiration warnings
 */

import { AlertCircle, Calendar, Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveRentals } from '../hooks/useBilling';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function ActiveRentals() {
  const { data: rentals = [], isLoading } = useActiveRentals();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (rentals.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-6 h-6" />}
        title="Нет активных аренд"
        description="Вы еще не арендовали ни одного слота для товаров. Арендуйте слоты, чтобы отображать больше товаров в вашем магазине."
      />
    );
  }

  return (
    <div className="space-y-3">
      {rentals.map((rental) => {
        const isExpiringSoon = rental.days_remaining <= 7;
        const isExpired = rental.days_remaining <= 0;

        return (
          <div
            key={rental.id}
            className={`p-4 rounded-lg border-2 transition-colors ${
              isExpired
                ? 'border-red-300 bg-red-50'
                : isExpiringSoon
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">
                    Slot #{rental.slot_number}
                  </h4>
                  {rental.product_name && (
                    <span className="text-sm text-gray-500">
                      ({rental.product_name})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Начало: {new Date(rental.start_date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Истекает: {new Date(rental.expiration_date).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                {(isExpiringSoon || isExpired) && (
                  <div
                    className={`mt-3 flex items-center gap-2 text-sm font-medium ${
                      isExpired ? 'text-red-700' : 'text-yellow-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {isExpired
                        ? 'Аренда истекла!'
                        : `Истекает через ${rental.days_remaining} ${
                            rental.days_remaining === 1 ? 'день' : rental.days_remaining < 5 ? 'дня' : 'дней'
                          }`}
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-4">
                <Link to="/shop/billing/topup" state={{ rentalId: rental.id }}>
                  <Button
                    size="sm"
                    variant={isExpired || isExpiringSoon ? 'primary' : 'outline'}
                  >
                    Продлить
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
