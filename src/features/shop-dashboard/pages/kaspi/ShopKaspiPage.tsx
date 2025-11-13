import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs';
import { Settings, Package, MessageSquare } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { KaspiSettingsTab } from './components/KaspiSettingsTab';
import { KaspiOrdersTab } from './components/KaspiOrdersTab';
import { KaspiNotificationsTab } from './components/KaspiNotificationsTab';

export default function ShopKaspiPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync URL with active tab
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Интеграция с Kaspi.kz</h1>
          <p className="text-gray-600 mt-2">
            Автоматическое получение заказов из Kaspi.kz и отправка WhatsApp уведомлений клиентам
          </p>
        </div>
        <BackButton to="/shop" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">
            <Package className="w-4 h-4 mr-2" />
            Заказы
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MessageSquare className="w-4 h-4 mr-2" />
            История уведомлений
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <KaspiOrdersTab />
        </TabsContent>

        <TabsContent value="notifications">
          <KaspiNotificationsTab />
        </TabsContent>

        <TabsContent value="settings">
          <KaspiSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
