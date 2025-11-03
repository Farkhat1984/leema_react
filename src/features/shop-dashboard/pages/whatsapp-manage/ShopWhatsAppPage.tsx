/**
 * Shop WhatsApp Management Page
 * Allows shop owners to manage WhatsApp integration and settings
 */

import { useState, useEffect } from 'react';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { toast } from 'react-hot-toast';

interface WhatsAppConnection {
  isConnected: boolean;
  phoneNumber?: string;
  qrCode?: string;
  lastSync?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
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

export default function ShopWhatsAppPage() {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isConnected: false,
    status: 'disconnected',
  });
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWhatsAppStatus();
  }, []);

  const loadWhatsAppStatus = async () => {
    try {
      // TODO: Replace with actual API call
      const mockConnection: WhatsAppConnection = {
        isConnected: false,
        status: 'disconnected',
      };
      setConnection(mockConnection);
    } catch (error) {
      toast.error('Ошибка загрузки статуса WhatsApp');
    }
  };

  const connectWhatsApp = async () => {
    try {
      setLoading(true);
      setConnection({ ...connection, status: 'connecting' });
      
      // TODO: Replace with actual API call to get QR code
      setTimeout(() => {
        setConnection({
          isConnected: true,
          phoneNumber: '+7 777 123 4567',
          status: 'connected',
          lastSync: new Date().toISOString(),
        });
        toast.success('WhatsApp успешно подключен!');
        setLoading(false);
      }, 2000);
    } catch (error) {
      setConnection({ ...connection, status: 'error' });
      toast.error('Ошибка подключения WhatsApp');
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      // TODO: API call
      setConnection({
        isConnected: false,
        status: 'disconnected',
        phoneNumber: undefined,
        lastSync: undefined,
      });
      toast.success('WhatsApp отключен');
    } catch (error) {
      toast.error('Ошибка отключения WhatsApp');
    }
  };

  const saveSettings = async () => {
    try {
      // TODO: API call to save settings
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Ошибка сохранения настроек');
    }
  };

  const getStatusBadge = () => {
    const badges = {
      disconnected: <Badge className="bg-gray-100 text-gray-800">⚪ Не подключен</Badge>,
      connecting: <Badge className="bg-yellow-100 text-yellow-800">🔄 Подключение...</Badge>,
      connected: <Badge className="bg-green-100 text-green-800">✅ Подключен</Badge>,
      error: <Badge className="bg-red-100 text-red-800">❌ Ошибка</Badge>,
    };
    return badges[connection.status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление WhatsApp</h1>
          <p className="text-gray-600 mt-1">
            Настройте интеграцию с WhatsApp для общения с клиентами
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Connection Status Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Статус подключения</h3>
        
        {!connection.isConnected ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📱</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              WhatsApp не подключен
            </h4>
            <p className="text-gray-600 mb-6">
              Подключите WhatsApp для общения с клиентами в реальном времени
            </p>
            <Button
              onClick={connectWhatsApp}
              variant="primary"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? '🔄 Подключение...' : '✅ Подключить WhatsApp'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-3xl">✅</div>
                <div>
                  <p className="font-medium text-gray-900">WhatsApp подключен</p>
                  <p className="text-sm text-gray-600">
                    Номер: {connection.phoneNumber}
                  </p>
                  {connection.lastSync && (
                    <p className="text-xs text-gray-500">
                      Последняя синхронизация:{' '}
                      {new Date(connection.lastSync).toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={disconnectWhatsApp}
                variant="outline"
                className="text-red-600 border-red-600"
              >
                Отключить
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-600">Активных чатов</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">Сообщений сегодня</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-600">Непрочитанных</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Settings Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Настройки автоматизации</h3>
        
        <div className="space-y-6">
          {/* Auto Reply */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-medium text-gray-900">
                  Автоответ
                </label>
                <p className="text-sm text-gray-600">
                  Автоматически отвечать на первое сообщение клиента
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoReply: !settings.autoReply })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoReply ? 'bg-blue-600' : 'bg-gray-200'
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
              <label className="font-medium text-gray-900">
                Уведомления о заказах
              </label>
              <p className="text-sm text-gray-600">
                Получать уведомления о новых заказах в WhatsApp
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, orderNotifications: !settings.orderNotifications })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.orderNotifications ? 'bg-blue-600' : 'bg-gray-200'
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
              <label className="font-medium text-gray-900">
                Запросы о товарах
              </label>
              <p className="text-sm text-gray-600">
                Получать вопросы клиентов о товарах
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, productInquiries: !settings.productInquiries })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.productInquiries ? 'bg-blue-600' : 'bg-gray-200'
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
                <label className="font-medium text-gray-900">
                  Рабочие часы
                </label>
                <p className="text-sm text-gray-600">
                  Ограничить автоответы рабочими часами
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    businessHours: { ...settings.businessHours, enabled: !settings.businessHours.enabled },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.businessHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
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
          <Button onClick={saveSettings} variant="primary">
            💾 Сохранить настройки
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
