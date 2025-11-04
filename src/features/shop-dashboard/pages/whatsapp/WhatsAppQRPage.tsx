/**
 * WhatsApp QR Page - Connect WhatsApp Business API
 * Allows shop owners to connect their WhatsApp account to the platform
 */

import { ArrowLeft, RefreshCw, Lightbulb, CheckCircle, XCircle, Loader } from "lucide-react";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import { useWhatsAppEvents } from '@/features/websocket/hooks/useWhatsAppEvents';
import toast from 'react-hot-toast';

interface WhatsAppQRResponse {
  qr_code: string | null;
  status: string;
  message?: string;
  already_connected?: boolean;
}

interface WhatsAppStatusResponse {
  status: string;
  ready?: boolean;
  has_qr?: boolean;
}

function WhatsAppQRPage() {
  const { shop } = useAuthStore();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);

  // Listen to WebSocket events for real-time status updates
  useWhatsAppEvents();

  useEffect(() => {
    loadWhatsAppStatus();
    // Auto-refresh QR code every 30 seconds if not connected
    const interval = setInterval(() => {
      if (status !== 'connected' && !isAlreadyConnected) {
        loadWhatsAppStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status, isAlreadyConnected]);

  const loadWhatsAppStatus = async () => {
    try {
      setIsLoading(true);
      // First check current status
      const statusResponse = await apiRequest<WhatsAppStatusResponse>(
        API_ENDPOINTS.SHOPS.WHATSAPP_STATUS
      );

      setStatus(statusResponse.status || 'disconnected');

      // If not connected, get QR code
      if (statusResponse.status !== 'connected') {
        const qrResponse = await apiRequest<WhatsAppQRResponse>(
          API_ENDPOINTS.SHOPS.WHATSAPP_QR
        );

        if (qrResponse.already_connected) {
          setIsAlreadyConnected(true);
          setStatus('connected');
          toast.success('WhatsApp уже подключен!');
        } else if (qrResponse.qr_code) {
          setQrCode(qrResponse.qr_code);
          setStatus(qrResponse.status || 'qr_received');
        } else if (qrResponse.status === 'generating') {
          setStatus('generating');
          toast('QR код генерируется, подождите...', { icon: 'ℹ️' });
          // Retry after 3 seconds
          setTimeout(loadWhatsAppStatus, 3000);
        }
      } else {
        setIsAlreadyConnected(true);
        toast.success('WhatsApp подключен!');
      }
    } catch (error) {
      logger.error('Failed to load WhatsApp status/QR', error);
      toast.error('Не удалось загрузить статус WhatsApp');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiRequest(
        API_ENDPOINTS.SHOPS.WHATSAPP_DISCONNECT,
        'POST'
      );
      toast.success('WhatsApp отключен. Отсканируйте новый QR код для подключения.');
      setIsAlreadyConnected(false);
      setStatus('disconnected');
      setQrCode(null);
      // Reload to get new QR
      setTimeout(loadWhatsAppStatus, 1000);
    } catch (error) {
      logger.error('Failed to disconnect WhatsApp', error);
      toast.error('Не удалось отключить WhatsApp');
    }
  };

  const handleRefreshQR = () => {
    setQrCode(null);
    loadWhatsAppStatus();
    toast('Обновление QR кода...', { icon: 'ℹ️' });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Подключено</span>
          </div>
        );
      case 'generating':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="font-medium">Генерация QR...</span>
          </div>
        );
      case 'qr_received':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Ожидание сканирования</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Ошибка</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Не подключено</span>
          </div>
        );
    }
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.SHOP.DASHBOARD}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <i className="fab fa-whatsapp text-green-600 text-2xl mr-3"></i>
                <span className="text-xl font-bold text-gray-900">WhatsApp Business</span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display or Connected Status */}
          <Card className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {isAlreadyConnected || status === 'connected'
                  ? 'WhatsApp подключен!'
                  : 'Подключение WhatsApp'}
              </h2>

              {isAlreadyConnected || status === 'connected' ? (
                <div className="py-12">
                  <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    WhatsApp Business подключен
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Ваш магазин может отправлять сообщения клиентам
                  </p>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Отключить WhatsApp
                  </Button>
                </div>
              ) : qrCode ? (
                <div className="mb-6">
                  <div className="inline-block p-4 bg-white border-4 border-green-500 rounded-lg">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Отсканируйте QR код в WhatsApp на телефоне
                  </p>
                  <Button
                    onClick={handleRefreshQR}
                    variant="outline"
                    className="mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Обновить QR код
                  </Button>
                </div>
              ) : (
                <div className="py-12">
                  {status === 'generating' ? (
                    <>
                      <Loader className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
                      <p className="text-gray-500">Генерация QR кода...</p>
                    </>
                  ) : (
                    <>
                      <i className="fab fa-whatsapp text-gray-300 text-6xl mb-4"></i>
                      <p className="text-gray-500 mb-4">QR код недоступен</p>
                      <Button onClick={handleRefreshQR} variant="primary">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Получить QR код
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Как подключить WhatsApp
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </span>
                  <span>Откройте WhatsApp на своем телефоне</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </span>
                  <span>
                    Перейдите в <strong>Настройки</strong> → <strong>Связанные устройства</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </span>
                  <span>Нажмите <strong>"Привязать устройство"</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    4
                  </span>
                  <span>Отсканируйте QR код на экране слева</span>
                </li>
              </ol>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Что дает подключение
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Автоматическая отправка сообщений клиентам о товарах</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Рассылка акций и новостей через WhatsApp</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Уведомления о новых заказах в WhatsApp</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Повышение конверсии обращений клиентов</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                ⚠️ Важно
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• QR код действителен 60 секунд</li>
                <li>• После сканирования подключение произойдет автоматически</li>
                <li>• Вы можете отключить WhatsApp в любое время</li>
                <li>• Убедитесь, что у вас есть номер WhatsApp в настройках магазина</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppQRPage;
