import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/Tabs'
import { Users, Plus, History } from 'lucide-react'
import { ContactsTab } from '../components/ContactsTab'
import { CreateNewsletterTab } from '../components/CreateNewsletterTab'
import { NewsletterHistoryTab } from '../components/NewsletterHistoryTab'

export default function ShopNewslettersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') || 'contacts'
  const [activeTab, setActiveTab] = useState(tabParam)

  // Sync URL with active tab
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Управление рассылками</h1>
        <p className="text-gray-600 mt-2">
          Управляйте контактами, создавайте рассылки и отслеживайте эффективность кампаний
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="contacts">
        <TabsList className="mb-6">
          <TabsTrigger value="contacts">
            <Users className="w-4 h-4 mr-2" />
            Контакты
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Создать рассылку
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            История рассылок
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="create">
          <CreateNewsletterTab />
        </TabsContent>

        <TabsContent value="history">
          <NewsletterHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
