/**
 * WhatsApp Integration Page - Simplified
 * Flow: Click button → Show QR → Scan → Connected
 */

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader, RefreshCw, Smartphone, Clock } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { useAuthStore } from '@/features/auth/store/authStore';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { logger } from '@/shared/lib/utils/logger';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { useWebSocketEvent } from '@/features/websocket/hooks';

// ===== Types =====
interface WhatsAppQRResponse {
  qr_code: string | null;
  status: string;
  message?: string;
  already_connected?: boolean;
}

interface WhatsAppStatusResponse {
  status: string;
}

// ===== Countdown Timer Component =====
const CountdownTimer = ({ seconds }: { seconds: number }) => {
  // Цветовая индикация: зеленый > желтый > красный
  const getColorClasses = () => {
    if (seconds > 40) {
      return 'bg-green-500 text-white';
    } else if (seconds > 20) {
      return 'bg-yellow-500 text-white';
    } else if (seconds > 10) {
      return 'bg-orange-500 text-white';
    } else {
      return 'bg-red-500 text-white animate-pulse';
    }
  };

  return (
    <div className={`${getColorClasses()} text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-colors duration-300`}>
      <Clock className="w-3.5 h-3.5" />
      <span className="font-medium tabular-nums">{seconds}с</span>
    </div>
  );
};

// ===== Main Component =====
export default function UnifiedWhatsAppPage() {
  const { shop } = useAuthStore();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<number>(60); // QR код действует 60 секунд
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check status on mount and when page becomes visible
  useEffect(() => {
    checkStatus();

    // Re-check status when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info('Page became visible, re-checking WhatsApp status...');
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup intervals on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Countdown timer for QR code expiration
  useEffect(() => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Start countdown only when QR is displayed AND status is qr_received
    if (status === 'qr_received' && qrCode) {
      setCountdown(60); // Reset to 60 seconds

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // QR expired, stop countdown and clear QR
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setQrCode(null);
            setQrImageUrl(null);
            setStatus('disconnected');
            toast('QR код истек. Нажмите "Получить QR код" для новой попытки', { icon: '⏰' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second
    } else {
      // Stop countdown and reset when status changes (connected, disconnected, etc.)
      setCountdown(60);
    }

    // Cleanup
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [status, qrCode]);

  // Listen for WebSocket status updates
  useWebSocketEvent('whatsapp_status_changed', (data: any) => {
    logger.info('WhatsApp status changed via WebSocket', data);

    // Stop status polling when we get a webhook
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    // Stop countdown timer on any status change
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Handle successful connection
    if (data.connected === true || data.status === 'connected') {
      setStatus('connected');
      setQrCode(null);
      setQrImageUrl(null);
      setCountdown(60);
      toast.success('✅ WhatsApp успешно подключен!');
    }
    // Handle disconnection or logged_out
    else if (data.status === 'disconnected' || data.status === 'logged_out' || data.connected === false) {
      setStatus('disconnected');
      setQrCode(null);
      setQrImageUrl(null);
      setCountdown(60);
      toast.info('WhatsApp отключен');
    }
    // Handle phone mismatch error
    else if (data.phone_mismatch) {
      setStatus('error');
      setQrCode(null);
      setQrImageUrl(null);
      toast.error(data.message || 'Ошибка: Номер WhatsApp не совпадает');
    }
    // Handle any other status change
    else if (data.status) {
      setStatus(data.status);
      logger.info('Status updated to:', data.status);
    }
  });

  // Auto-check status when QR is shown (fallback if webhook doesn't arrive)
  useEffect(() => {
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }

    // Start polling only when QR is displayed
    if (status === 'qr_received' && qrCode) {
      logger.info('Starting status polling (QR displayed)...');

      statusCheckIntervalRef.current = setInterval(async () => {
        try {
          const response = await apiRequest<WhatsAppStatusResponse>(
            API_ENDPOINTS.SHOPS.WHATSAPP_STATUS
          );

          logger.info('Status poll result:', response.status);

          if (response.status === 'connected') {
            setStatus('connected');
            setQrCode(null);
            setQrImageUrl(null);
            toast.success('✅ WhatsApp успешно подключен!');

            // Stop polling
            if (statusCheckIntervalRef.current) {
              clearInterval(statusCheckIntervalRef.current);
              statusCheckIntervalRef.current = null;
            }
          }
        } catch (error) {
          logger.error('Status poll error:', error);
        }
      }, 3000); // Check every 3 seconds
    }

    // Cleanup
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [status, qrCode]);

  // Generate QR image when qrCode changes
  useEffect(() => {
    if (!qrCode) {
      setQrImageUrl(null);
      return;
    }

    logger.info('QR Code received, generating image...', {
      qrCodeLength: qrCode.length,
      startsWithData: qrCode.startsWith('data:image'),
      startsWithWhatsApp: qrCode.startsWith('2@'),
    });

    // If it's already a base64 image
    if (qrCode.startsWith('data:image')) {
      logger.info('QR is already base64 image');
      setQrImageUrl(qrCode);
      return;
    }

    // If it's a base64 string without prefix
    if (!qrCode.startsWith('2@') && /^[A-Za-z0-9+/=]{50,}$/.test(qrCode)) {
      logger.info('QR is base64 string without prefix');
      setQrImageUrl(`data:image/png;base64,${qrCode}`);
      return;
    }

    // Generate QR from string (WhatsApp format: 2@...)
    const canvas = canvasRef.current;
    if (!canvas) {
      logger.error('Canvas ref not available');
      return;
    }

    logger.info('Generating QR code from WhatsApp string...');
    QRCode.toCanvas(canvas, qrCode, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(() => {
        const imageUrl = canvas.toDataURL('image/png');
        logger.info('QR code generated successfully');
        setQrImageUrl(imageUrl);
      })
      .catch((error) => {
        logger.error('Failed to generate QR code', error);
      });
  }, [qrCode]);

  // Check current connection status
  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest<WhatsAppStatusResponse>(
        API_ENDPOINTS.SHOPS.WHATSAPP_STATUS
      );
      setStatus(response.status || 'disconnected');
    } catch (error: any) {
      logger.error('Failed to check WhatsApp status', error);
      setStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code
  const generateQR = async () => {
    try {
      setIsLoading(true);
      setQrCode(null);
      setQrImageUrl(null);

      const response = await apiRequest<WhatsAppQRResponse>(
        API_ENDPOINTS.SHOPS.WHATSAPP_QR
      );

      logger.info('QR Response:', response);

      if (response.already_connected || response.status === 'connected') {
        setStatus('connected');
        toast.success('WhatsApp уже подключен!');
        return;
      }

      if (response.qr_code) {
        logger.info('Setting QR code:', response.qr_code.substring(0, 50));
        setQrCode(response.qr_code);
        setStatus('qr_received');
        toast.success('QR код получен! Отсканируйте его в WhatsApp');
      } else if (response.status === 'generating') {
        setStatus('generating');
        toast('QR код генерируется, подождите несколько секунд и нажмите снова', { icon: 'ℹ️' });
      } else {
        logger.error('No QR code in response:', response);
        toast.error('Не удалось получить QR код');
        setStatus('error');
      }
    } catch (error: any) {
      logger.error('Failed to generate QR', error);
      toast.error('Ошибка при получении QR кода');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect WhatsApp
  const disconnect = async () => {
    if (!confirm('Отключить WhatsApp? Вам потребуется заново отсканировать QR код.')) {
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest(API_ENDPOINTS.SHOPS.WHATSAPP_DISCONNECT, 'POST');
      toast.success('WhatsApp отключен');
      setStatus('disconnected');
      setQrCode(null);
      setQrImageUrl(null);
    } catch (error: any) {
      logger.error('Failed to disconnect', error);
      toast.error('Не удалось отключить WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };


  // Status badge
  const getStatusBadge = () => {
    const badges = {
      checking: (
        <Badge className="bg-gray-100 text-gray-800">
          <Loader className="w-4 h-4 mr-1 inline animate-spin" />
          Проверка...
        </Badge>
      ),
      disconnected: (
        <Badge className="bg-gray-100 text-gray-800">
          <XCircle className="w-4 h-4 mr-1 inline" />
          Не подключен
        </Badge>
      ),
      generating: (
        <Badge className="bg-blue-100 text-blue-800">
          <Loader className="w-4 h-4 mr-1 inline animate-spin" />
          Генерация QR...
        </Badge>
      ),
      qr_received: (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Smartphone className="w-4 h-4 mr-1 inline" />
          Ожидание сканирования
        </Badge>
      ),
      connected: (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1 inline" />
          Подключен
        </Badge>
      ),
      error: (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1 inline" />
          Ошибка
        </Badge>
      ),
    };
    return badges[status as keyof typeof badges] || badges.disconnected;
  };

  // Loading state
  if (isLoading && status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fab fa-whatsapp text-green-600 text-2xl mr-3"></i>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WhatsApp Business</h1>
                <p className="text-xs text-gray-500">Подключение для отправки сообщений клиентам</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge()}
              <BackButton to={ROUTES.SHOP.DASHBOARD} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: QR Code or Status */}
          <Card className="p-8">
            <div className="text-center">
              {status === 'connected' ? (
                // Connected
                <div className="py-12">
                  <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    WhatsApp подключен!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Ваш магазин может отправлять сообщения клиентам
                  </p>
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    Отключить WhatsApp
                  </Button>
                </div>
              ) : (qrCode && qrImageUrl) || (status === 'qr_received' && qrCode) ? (
                // QR Code
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Отсканируйте QR код
                  </h2>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {qrImageUrl ? (
                    <div className="inline-block p-4 bg-white border-4 border-green-500 rounded-lg mb-4">
                      <img
                        src={qrImageUrl}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="inline-block p-4 mb-4">
                      <Loader className="w-16 h-16 text-green-600 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600 mt-2">Генерация изображения...</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    Откройте WhatsApp → Настройки → Связанные устройства → Привязать устройство
                  </p>
                  <div className="space-y-2">
                    <Button onClick={generateQR} variant="outline" disabled={isLoading}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Обновить QR код
                    </Button>
                    <div className="flex items-center justify-center gap-2">
                      {countdown > 0 ? (
                        <>
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            QR код действует еще
                          </span>
                          <CountdownTimer seconds={countdown} />
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">QR код истек</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Not connected
                <div className="py-12">
                  {status === 'generating' ? (
                    <>
                      <Loader className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-4" />
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Генерация QR кода...
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Подождите несколько секунд
                      </p>
                      <Button onClick={generateQR} variant="primary" disabled={isLoading}>
                        Попробовать снова
                      </Button>
                    </>
                  ) : (
                    <>
                      <i className="fab fa-whatsapp text-gray-300 text-6xl mb-4"></i>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        WhatsApp не подключен
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Подключите WhatsApp для отправки сообщений клиентам
                      </p>
                      <Button
                        onClick={generateQR}
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 mr-2" />
                            Подключить WhatsApp
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Right: Instructions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📱 Как подключить
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    1
                  </span>
                  <span>Нажмите кнопку "Подключить WhatsApp"</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    2
                  </span>
                  <span>Откройте WhatsApp на телефоне</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    3
                  </span>
                  <span>
                    Перейдите в <strong>Настройки → Связанные устройства</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    4
                  </span>
                  <span>Отсканируйте QR код на экране</span>
                </li>
              </ol>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                ✨ Возможности
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Отправка сообщений о товарах клиентам</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Уведомления о заказах Kaspi</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Рассылка новостей и акций</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Важно</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• QR код действует 60 секунд</li>
                <li>• После сканирования подключение происходит автоматически</li>
                <li>• Используйте номер телефона, указанный в профиле магазина</li>
                <li>• Можно отключить в любое время и подключить заново</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
