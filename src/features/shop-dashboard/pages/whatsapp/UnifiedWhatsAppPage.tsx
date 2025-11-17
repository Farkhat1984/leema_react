/**
 * Unified WhatsApp Management Page
 * Combines QR connection and settings in a single intuitive interface
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Smartphone, Settings, BarChart3, CheckCircle, XCircle, Loader, RefreshCw, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
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
import { useWhatsAppEvents } from '@/features/websocket/hooks/useWhatsAppEvents';
import toast from 'react-hot-toast';

// ===== Types =====
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

interface WhatsAppSettings {
  autoReply: boolean;
  autoReplyMessage: string;
  orderNotifications: boolean;
  productInquiries: boolean;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

type TabType = 'connection' | 'settings' | 'statistics';

// ===== Main Component =====
export default function UnifiedWhatsAppPage() {
  const { shop } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettings>({
    autoReply: true,
    autoReplyMessage: 'Здравствуйте! Спасибо за обращение. Мы ответим вам в ближайшее время.',
    orderNotifications: true,
    productInquiries: true,
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
    },
  });

  // Listen to WebSocket events for real-time status updates
  useWhatsAppEvents();

  useEffect(() => {
    // Load initial status only on mount
    loadWhatsAppStatus();

    // Auto-refresh QR code every 30 seconds if not connected
    const interval = setInterval(() => {
      if (status !== 'connected' && !isAlreadyConnected && activeTab === 'connection') {
        loadWhatsAppStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Separate effect to handle tab changes
  useEffect(() => {
    if (activeTab === 'connection' && status !== 'connected' && !isAlreadyConnected) {
      loadWhatsAppStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ===== API Calls =====
  const loadWhatsAppStatus = async () => {
    try {
      setIsLoading(true);
      // First check current status
      const statusResponse = await apiRequest<WhatsAppStatusResponse>(
        API_ENDPOINTS.SHOPS.WHATSAPP_STATUS
      );

      const currentStatus = statusResponse.status || 'disconnected';
      setStatus(currentStatus);

      // If connected, show connected state
      if (currentStatus === 'connected') {
        setIsAlreadyConnected(true);
        toast.success('WhatsApp подключен!');
      } else {
        // If not connected, get QR code
        const qrResponse = await apiRequest<WhatsAppQRResponse>(
          API_ENDPOINTS.SHOPS.WHATSAPP_QR
        );

        if (qrResponse.already_connected || qrResponse.status === 'connected') {
          setIsAlreadyConnected(true);
          setStatus('connected');
          toast.success('WhatsApp уже подключен!');
        } else if (qrResponse.qr_code) {
          // QR code can be either:
          // 1. Base64 image string (starts with data:image or is pure base64)
          // 2. Raw WhatsApp QR string (format: 2@xxx...)
          const qrCodeData = qrResponse.qr_code;

          // Check if it's a base64 image
          const isBase64Image = qrCodeData.startsWith('data:image') ||
                                /^[A-Za-z0-9+/=]{50,}$/.test(qrCodeData);

          // Check if it's a raw WhatsApp QR string (starts with 2@)
          const isWhatsAppQR = qrCodeData.startsWith('2@');

          if (isBase64Image || isWhatsAppQR) {
            setQrCode(qrCodeData);
            setStatus(qrResponse.status || 'qr_received');
            // Removed spammy logger - QR is received successfully
          } else {
            logger.warn('Invalid QR code format received', { qrCode: qrCodeData?.substring(0, 50) });
            toast.error('Получен неверный формат QR кода. Попробуйте обновить.');
            setStatus('error');
          }
        } else if (qrResponse.status === 'generating') {
          setStatus('generating');
          toast('QR код генерируется, подождите...', { icon: 'ℹ️' });
          // Retry after 3 seconds
          setTimeout(loadWhatsAppStatus, 3000);
        }
      }
    } catch (error: any) {
      logger.error('Failed to load WhatsApp status/QR', error);
      toast.error('Не удалось загрузить статус WhatsApp');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiRequest(API_ENDPOINTS.SHOPS.WHATSAPP_DISCONNECT, 'POST');
      toast.success('WhatsApp отключен. Отсканируйте новый QR код для подключения.');
      setIsAlreadyConnected(false);
      setStatus('disconnected');
      setQrCode(null);
      // Reload to get new QR
      setTimeout(loadWhatsAppStatus, 1000);
    } catch (error: any) {
      logger.error('Failed to disconnect WhatsApp', error);

      // Check if endpoint doesn't exist yet
      if (error?.status === 500 || error?.status === 404) {
        toast.error('Функция отключения WhatsApp находится в разработке. Обратитесь к администратору.');
      } else {
        toast.error('Не удалось отключить WhatsApp');
      }
    }
  };

  const handleRefreshQR = () => {
    setQrCode(null);
    loadWhatsAppStatus();
    toast('Обновление QR кода...', { icon: 'ℹ️' });
  };

  const saveSettings = async () => {
    try {
      // TODO: API call to save settings
      toast.success('Настройки сохранены');
    } catch {
      toast.error('Ошибка сохранения настроек');
    }
  };

  // ===== UI Helpers =====
  const getStatusBadge = () => {
    const badges = {
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
          <RefreshCw className="w-4 h-4 mr-1 inline" />
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

  const tabs = [
    { id: 'connection' as const, label: 'Подключение', icon: Smartphone },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
    { id: 'statistics' as const, label: 'Статистика', icon: BarChart3 },
  ];

  // ===== Loading State =====
  if (isLoading && activeTab === 'connection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  // ===== Main Render =====
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
                <p className="text-xs text-gray-500">Управление интеграцией</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge()}
              <BackButton to={ROUTES.SHOP.DASHBOARD} />
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'connection' && (
          <ConnectionTab
            status={status}
            isAlreadyConnected={isAlreadyConnected}
            qrCode={qrCode}
            onDisconnect={handleDisconnect}
            onRefreshQR={handleRefreshQR}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            onSave={saveSettings}
            isConnected={isAlreadyConnected || status === 'connected'}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsTab isConnected={isAlreadyConnected || status === 'connected'} />
        )}
      </div>
    </div>
  );
}

// ===== Connection Tab =====
interface ConnectionTabProps {
  status: string;
  isAlreadyConnected: boolean;
  qrCode: string | null;
  onDisconnect: () => void;
  onRefreshQR: () => void;
}

function ConnectionTab({ status, isAlreadyConnected, qrCode, onDisconnect, onRefreshQR }: ConnectionTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // Generate QR code when qrCode changes
  useEffect(() => {
    if (!qrCode) {
      setQrImageUrl(null);
      return;
    }

    // If it's already a base64 image or data URL, use it directly
    if (qrCode.startsWith('data:image')) {
      setQrImageUrl(qrCode);
      return;
    }

    // If it's a long base64 string (not WhatsApp format), use it as base64
    if (!qrCode.startsWith('2@') && /^[A-Za-z0-9+/=]{50,}$/.test(qrCode)) {
      setQrImageUrl(`data:image/png;base64,${qrCode}`);
      return;
    }

    // Otherwise, it's a raw WhatsApp QR string - generate QR code
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then(() => {
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setQrImageUrl(dataUrl);
      })
      .catch((error) => {
        logger.error('Failed to generate QR code', error);
        toast.error('Не удалось создать QR код');
      });
  }, [qrCode]);
  return (
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
              <p className="text-sm text-gray-600 mb-4">
                Ваш магазин может отправлять сообщения клиентам
              </p>
              <div className="space-y-2">
                <Button
                  onClick={onDisconnect}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Отключить WhatsApp
                </Button>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Отключение позволит получить новый QR код для подключения другого устройства
                </p>
              </div>
            </div>
          ) : qrCode ? (
            <div className="mb-6">
              {/* Hidden canvas for QR code generation */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div className="inline-block p-4 bg-white border-4 border-green-500 rounded-lg">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 mx-auto"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                            <div class="text-center p-4">
                              <p class="text-gray-600 mb-2">Ошибка загрузки QR кода</p>
                              <p class="text-sm text-gray-500">Попробуйте обновить</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <Loader className="w-12 h-12 text-green-500 animate-spin" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Отсканируйте QR код в WhatsApp на телефоне
              </p>
              <Button onClick={onRefreshQR} variant="outline" className="mt-4">
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
                  <Button onClick={onRefreshQR} variant="primary" className="bg-green-600 hover:bg-green-700">
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
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Важно</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• QR код действителен 60 секунд</li>
            <li>• После сканирования подключение произойдет автоматически</li>
            <li>• Вы можете отключить WhatsApp в любое время</li>
            <li>
              • <strong>Обязательно укажите номер WhatsApp в{' '}
              <Link to={ROUTES.SHOP.PROFILE} className="underline font-semibold hover:text-yellow-900">
                настройках профиля
              </Link>
              </strong>
            </li>
            <li>• При сканировании QR кода используйте тот же номер, что указан в профиле</li>
            <li className="text-yellow-900 font-medium">
              • При изменении номера WhatsApp в профиле текущее подключение будет автоматически отключено
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ===== Settings Tab =====
interface SettingsTabProps {
  settings: WhatsAppSettings;
  setSettings: (settings: WhatsAppSettings) => void;
  onSave: () => void;
  isConnected: boolean;
}

function SettingsTab({ settings, setSettings, onSave, isConnected }: SettingsTabProps) {
  if (!isConnected) {
    return (
      <Card className="p-12 text-center">
        <XCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp не подключен</h3>
        <p className="text-gray-600">
          Подключите WhatsApp в разделе "Подключение", чтобы настроить автоматизацию
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Настройки автоматизации</h3>

        <div className="space-y-6">
          {/* Auto Reply */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-medium text-gray-900">Автоответ</label>
                <p className="text-sm text-gray-600">
                  Автоматически отвечать на первое сообщение клиента
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoReply: !settings.autoReply })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoReply ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoReply ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {settings.autoReply && (
              <textarea
                value={settings.autoReplyMessage}
                onChange={(e) =>
                  setSettings({ ...settings, autoReplyMessage: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-3 mt-2"
                rows={3}
                placeholder="Текст автоответа..."
              />
            )}
          </div>

          {/* Order Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Уведомления о заказах</label>
              <p className="text-sm text-gray-600">
                Получать уведомления о новых заказах в WhatsApp
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, orderNotifications: !settings.orderNotifications })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.orderNotifications ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.orderNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Product Inquiries */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Запросы о товарах</label>
              <p className="text-sm text-gray-600">Получать вопросы клиентов о товарах</p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, productInquiries: !settings.productInquiries })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.productInquiries ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.productInquiries ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Business Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-medium text-gray-900">Рабочие часы</label>
                <p className="text-sm text-gray-600">
                  Ограничить автоответы рабочими часами
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    businessHours: {
                      ...settings.businessHours,
                      enabled: !settings.businessHours.enabled,
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.businessHours.enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.businessHours.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {settings.businessHours.enabled && (
              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Начало</label>
                  <input
                    type="time"
                    value={settings.businessHours.start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        businessHours: { ...settings.businessHours, start: e.target.value },
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Конец</label>
                  <input
                    type="time"
                    value={settings.businessHours.end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        businessHours: { ...settings.businessHours, end: e.target.value },
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button onClick={onSave} variant="primary" className="bg-green-600 hover:bg-green-700">
            Сохранить настройки
          </Button>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold mb-2 text-blue-900">💡 Советы по использованию</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Используйте автоответ для быстрого реагирования на запросы</li>
          <li>• Настройте рабочие часы, чтобы не беспокоить клиентов в нерабочее время</li>
          <li>• Регулярно проверяйте непрочитанные сообщения</li>
          <li>• Отвечайте на вопросы о товарах максимально быстро</li>
        </ul>
      </Card>
    </div>
  );
}

// ===== Statistics Tab =====
interface StatisticsTabProps {
  isConnected: boolean;
}

function StatisticsTab({ isConnected }: StatisticsTabProps) {
  if (!isConnected) {
    return (
      <Card className="p-12 text-center">
        <XCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp не подключен</h3>
        <p className="text-gray-600">
          Подключите WhatsApp в разделе "Подключение", чтобы видеть статистику
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center bg-blue-50 border-blue-200">
          <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
          <div className="text-sm text-gray-600">Активных чатов</div>
        </Card>
        <Card className="p-6 text-center bg-green-50 border-green-200">
          <div className="text-4xl font-bold text-green-600 mb-2">0</div>
          <div className="text-sm text-gray-600">Сообщений сегодня</div>
        </Card>
        <Card className="p-6 text-center bg-purple-50 border-purple-200">
          <div className="text-4xl font-bold text-purple-600 mb-2">0</div>
          <div className="text-sm text-gray-600">Непрочитанных</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Активность за последние 7 дней</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-2 text-gray-300" />
            <p>График активности появится здесь</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">📊 Скоро</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Детальная статистика по сообщениям</li>
          <li>• График активности клиентов</li>
          <li>• Аналитика конверсии</li>
          <li>• Экспорт данных</li>
        </ul>
      </Card>
    </div>
  );
}
