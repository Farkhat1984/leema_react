/**
 * Shop Reports Page - Generate and download various reports
 * Allows shop owners to generate sales, inventory, and customer reports
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, TrendingUp, ShoppingCart, Package, Users, Download, Check, Info } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { FormDateRangePicker } from '@/shared/components/forms/FormDateRangePicker';
import type { DateRange } from '@/shared/types/common';
import toast from 'react-hot-toast';
import { logger } from '@/shared/lib/utils/logger';

function ShopReportsPage() {
  const [salesDateRange, setSalesDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [ordersDateRange, setOrdersDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [productsDateRange, setProductsDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerateReport = async (
    type: 'sales' | 'orders' | 'products' | 'customers',
    dateRange?: DateRange
  ) => {
    try {
      setIsGenerating(type);

      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }

      const response = await apiRequest(
        `${API_ENDPOINTS.SHOPS.ME}/reports/${type}?${params}`,
        'GET',
        undefined
      );

      // Download file
      const blob = new Blob([response as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Отчет успешно сгенерирован');
    } catch (error) {
      logger.error('Failed to generate report', error);
      toast.error('Не удалось сгенерировать отчет');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.SHOP.DASHBOARD}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-purple-600 text-2xl mr-3" />
                <span className="text-xl font-bold text-gray-900">Отчеты</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Report */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-4 h-4 text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Отчет по продажам</h3>
                <p className="text-sm text-gray-500">Выручка и статистика продаж</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormDateRangePicker
                value={salesDateRange}
                onChange={(range) => setSalesDateRange(range)}
                label="Период"
              />

              <Button
                onClick={() => handleGenerateReport('sales', salesDateRange)}
                variant="primary"
                className="w-full"
                isLoading={isGenerating === 'sales'}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать отчет
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Общая выручка за период
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Разбивка по категориям
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Топ продаваемых товаров
                </p>
              </div>
            </div>
          </Card>

          {/* Orders Report */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <ShoppingCart className="w-4 h-4 text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Отчет по заказам</h3>
                <p className="text-sm text-gray-500">Детальная информация о заказах</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormDateRangePicker
                value={ordersDateRange}
                onChange={(range) => setOrdersDateRange(range)}
                label="Период"
              />

              <Button
                onClick={() => handleGenerateReport('orders', ordersDateRange)}
                variant="primary"
                className="w-full"
                isLoading={isGenerating === 'orders'}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать отчет
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Список всех заказов
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Статусы и даты доставки
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Информация о клиентах
                </p>
              </div>
            </div>
          </Card>

          {/* Products Report */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Package className="w-4 h-4 text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Отчет по товарам</h3>
                <p className="text-sm text-gray-500">Инвентаризация и статистика</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormDateRangePicker
                value={productsDateRange}
                onChange={(range) => setProductsDateRange(range)}
                label="Период"
              />

              <Button
                onClick={() => handleGenerateReport('products', productsDateRange)}
                variant="primary"
                className="w-full"
                isLoading={isGenerating === 'products'}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать отчет
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Список всех товаров
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Просмотры и примерки
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Статусы модерации
                </p>
              </div>
            </div>
          </Card>

          {/* Customers Report */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-4 h-4 text-orange-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Отчет по клиентам</h3>
                <p className="text-sm text-gray-500">База клиентов и активность</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Полный список клиентов с историей покупок
              </div>

              <Button
                onClick={() => handleGenerateReport('customers')}
                variant="primary"
                className="w-full"
                isLoading={isGenerating === 'customers'}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать отчет
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Контактная информация
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Количество заказов
                </p>
                <p className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Общая сумма покупок
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 text-xl mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">О отчетах</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Все отчеты генерируются в формате Excel (.xlsx)</li>
                <li>• Для отчетов по продажам, заказам и товарам можно выбрать период</li>
                <li>• Отчет по клиентам включает всю базу данных</li>
                <li>• Отчеты содержат детальную информацию для анализа бизнеса</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShopReportsPage;
