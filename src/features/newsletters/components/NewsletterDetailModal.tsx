import { DetailModal, DetailRow, DetailSection } from '@/shared/components/ui/DetailModal'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { MessageSquare, Image as ImageIcon, Users, Calendar, TrendingUp } from 'lucide-react'
import type { Newsletter } from '../types/newsletter.types'

interface NewsletterDetailModalProps {
  isOpen: boolean
  onClose: () => void
  newsletter: Newsletter | null
}

const STATUS_CONFIG = {
  draft: { label: 'Черновик', color: 'gray' as const },
  pending: { label: 'Ожидание одобрения', color: 'yellow' as const },
  approved: { label: 'Одобрено', color: 'green' as const },
  rejected: { label: 'Отклонено', color: 'red' as const },
  sending: { label: 'Отправляется', color: 'blue' as const },
  in_progress: { label: 'В процессе', color: 'blue' as const },
  completed: { label: 'Завершено', color: 'green' as const },
  failed: { label: 'Ошибка', color: 'red' as const },
  cancelled: { label: 'Отменено', color: 'gray' as const },
}

export function NewsletterDetailModal({
  isOpen,
  onClose,
  newsletter,
}: NewsletterDetailModalProps) {
  if (!newsletter) return

  const statusConfig = STATUS_CONFIG[newsletter.status] || STATUS_CONFIG.draft

  // Convert relative image paths to full URLs
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.leema.kz'
  const fullImageUrls = newsletter.creative_images?.map(imagePath => {
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    // Convert relative path to full URL
    return `${API_URL}${imagePath}`
  }) || []

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="Детали рассылки"
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <DetailSection title="Основная информация">
          <DetailRow label="Название" value={newsletter.title} />
          {newsletter.description && (
            <DetailRow label="Описание" value={newsletter.description} />
          )}
          <DetailRow
            label="Статус"
            value={
              <StatusBadge
                status={newsletter.status}
                variant={statusConfig.color}
              />
            }
          />
          {newsletter.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-1">Причина отклонения:</h4>
              <p className="text-sm text-red-800">{newsletter.rejection_reason}</p>
            </div>
          )}
        </DetailSection>

        {/* Text Messages */}
        {/* @ts-ignore - backend returns creative_texts */}
        {newsletter.creative_texts && newsletter.creative_texts.length > 0 && (
          <DetailSection title="Текстовые сообщения" icon={<MessageSquare className="w-5 h-5" />}>
            <div className="space-y-3">
              {/* @ts-ignore */}
              {newsletter.creative_texts.map((text: string, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="text-xs text-gray-500 mb-1">Сообщение {index + 1}</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Images */}
        {fullImageUrls.length > 0 && (
          <DetailSection title="Изображения" icon={<ImageIcon className="w-5 h-5" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {fullImageUrls.map((imageUrl, index) => (
                <div key={index} className="rounded-lg border border-gray-200 overflow-hidden h-48">
                  <img
                    src={imageUrl}
                    alt={`Изображение рассылки ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Recipients */}
        <DetailSection title="Получатели" icon={<Users className="w-5 h-5" />}>
          <DetailRow
            label="Тип получателей"
            value={
              newsletter.recipient_type === 'all'
                ? 'Все контакты'
                : `Выбранные контакты (${newsletter.recipient_ids?.length || 0})`
            }
          />
          <DetailRow
            label="Всего получателей"
            value={newsletter.total_recipients?.toString() || '0'}
          />
        </DetailSection>

        {/* Dates */}
        <DetailSection title="График" icon={<Calendar className="w-5 h-5" />}>
          <DetailRow
            label="Создано"
            value={new Date(newsletter.created_at).toLocaleString()}
          />
          {newsletter.scheduled_at && (
            <DetailRow
              label="Запланировано"
              value={new Date(newsletter.scheduled_at).toLocaleString()}
            />
          )}
          {newsletter.sent_at && (
            <DetailRow
              label="Отправлено"
              value={new Date(newsletter.sent_at).toLocaleString()}
            />
          )}
        </DetailSection>

        {/* Metrics (for sent newsletters) */}
        {newsletter.status === 'completed' && (
          <DetailSection title="Производительность" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {newsletter.sent_count}
                </div>
                <div className="text-xs text-blue-700 mt-1">Отправлено</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">
                  {newsletter.opened_count || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">Открыто</div>
                {newsletter.sent_count > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((newsletter.opened_count || 0) / newsletter.sent_count * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {newsletter.clicked_count || 0}
                </div>
                <div className="text-xs text-purple-700 mt-1">Клики</div>
                {newsletter.sent_count > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((newsletter.clicked_count || 0) / newsletter.sent_count * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </DetailSection>
        )}
      </div>
    </DetailModal>
  )
}
