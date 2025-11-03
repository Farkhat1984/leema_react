/**
 * WhatsApp QR Page - Generate and display WhatsApp QR code for shop
 * Allows customers to quickly connect via WhatsApp
 */

import { ArrowLeft, Download, Printer, AlertTriangle, RefreshCw, Lightbulb, CheckCircle } from "lucide-react";
import { logger } from '@/shared/lib/utils/logger';
import { useState, useEffect } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { Link } from 'react-router-dom';
import { logger } from '@/shared/lib/utils/logger';
import { useAuthStore } from '@/features/auth/store/authStore';
import { logger } from '@/shared/lib/utils/logger';
import { apiRequest } from '@/shared/lib/api/client';
import { logger } from '@/shared/lib/utils/logger';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/lib/utils/logger';
import { ROUTES } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';
import { Card } from '@/shared/components/feedback/Card';
import { logger } from '@/shared/lib/utils/logger';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { logger } from '@/shared/lib/utils/logger';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import toast from 'react-hot-toast';
import { logger } from '@/shared/lib/utils/logger';

interface QRCodeData {
  qrCodeUrl: string;
  whatsappNumber: string;
  message: string;
}

function WhatsAppQRPage() {
  const { shop } = useAuthStore();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest<QRCodeData>(
        `${API_ENDPOINTS.SHOPS.ME}/whatsapp-qr`
      );
      setQrData(response);
      setCustomMessage(response.message || '');
    } catch (error) {
      logger.error('Failed to load QR code', error);
      toast.error('Не удалось загрузить QR код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateQR = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest<QRCodeData>(
        `${API_ENDPOINTS.SHOPS.ME}/whatsapp-qr/regenerate`,
        'POST',
        { message: customMessage }
      );
      setQrData(response);
      toast.success('QR код обновлен');
    } catch (error) {
      logger.error('Failed to regenerate QR code', error);
      toast.error('Не удалось обновить QR код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrData.qrCodeUrl;
    link.download = `whatsapp-qr-${shop?.name || 'shop'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR код скачан');
  };

  const handlePrintQR = () => {
    window.print();
    toast.success('Окно печати открыто');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 print:hidden">
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
                <i className="fab fa-whatsapp text-green-600 text-2xl mr-3"></i>
                <span className="text-xl font-bold text-gray-900">WhatsApp QR код</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <Card className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                QR код для WhatsApp
              </h2>

              {qrData?.qrCodeUrl ? (
                <div className="mb-6">
                  <div className="inline-block p-4 bg-white border-4 border-green-500 rounded-lg">
                    <img
                      src={qrData.qrCodeUrl}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Отсканируйте QR код для связи через WhatsApp
                  </p>
                </div>
              ) : (
                <div className="py-12">
                  <i className="fab fa-whatsapp text-gray-300 text-6xl mb-4"></i>
                  <p className="text-gray-500">QR код недоступен</p>
                </div>
              )}

              <div className="space-y-3 print:hidden">
                <Button
                  onClick={handleDownloadQR}
                  variant="primary"
                  className="w-full"
                  disabled={!qrData?.qrCodeUrl}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать QR код
                </Button>
                <Button
                  onClick={handlePrintQR}
                  variant="outline"
                  className="w-full"
                  disabled={!qrData?.qrCodeUrl}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Распечатать
                </Button>
              </div>
            </div>
          </Card>

          {/* Configuration */}
          <div className="space-y-6 print:hidden">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Номер WhatsApp
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono">
                      {qrData?.whatsappNumber || shop?.phone || 'Не указан'}
                    </div>
                  </div>
                  {!shop?.phone && (
                    <p className="mt-2 text-sm text-orange-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Добавьте номер телефона в настройках магазина
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Приветственное сообщение
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Например: Здравствуйте! Я хочу узнать о ваших товарах."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Это сообщение будет автоматически добавлено при сканировании QR кода
                  </p>
                </div>

                <Button
                  onClick={handleRegenerateQR}
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обновить QR код
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                <Lightbulb className="w-4 h-4 mr-2" />
                Как использовать
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Распечатайте QR код и разместите его в вашем магазине</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Добавьте QR код на визитки и рекламные материалы</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Разместите на вашем сайте или в социальных сетях</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Клиенты смогут быстро связаться с вами через WhatsApp</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsAppQRPage;
