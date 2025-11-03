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
  draft: { label: 'Draft', color: 'gray' as const },
  pending: { label: 'Pending Approval', color: 'yellow' as const },
  approved: { label: 'Approved', color: 'green' as const },
  rejected: { label: 'Rejected', color: 'red' as const },
  sending: { label: 'Sending', color: 'blue' as const },
  completed: { label: 'Completed', color: 'green' as const },
  failed: { label: 'Failed', color: 'red' as const },
}

export function NewsletterDetailModal({
  isOpen,
  onClose,
  newsletter,
}: NewsletterDetailModalProps) {
  if (!newsletter) return

  const statusConfig = STATUS_CONFIG[newsletter.status]

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="Newsletter Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <DetailSection title="Basic Information">
          <DetailRow label="Title" value={newsletter.title} />
          {newsletter.description && (
            <DetailRow label="Description" value={newsletter.description} />
          )}
          <DetailRow
            label="Status"
            value={
              <StatusBadge
                status={newsletter.status}
                variant={statusConfig.color}
              />
            }
          />
          {newsletter.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</h4>
              <p className="text-sm text-red-800">{newsletter.rejection_reason}</p>
            </div>
          )}
        </DetailSection>

        {/* Text Messages */}
        {/* @ts-ignore - backend returns creative_texts */}
        {newsletter.creative_texts && newsletter.creative_texts.length > 0 && (
          <DetailSection title="Text Messages" icon={<MessageSquare className="w-5 h-5" />}>
            <div className="space-y-3">
              {/* @ts-ignore */}
              {newsletter.creative_texts.map((text: string, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="text-xs text-gray-500 mb-1">Message {index + 1}</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Images */}
        {/* @ts-ignore - backend returns creative_images */}
        {newsletter.creative_images && newsletter.creative_images.length > 0 && (
          <DetailSection title="Images" icon={<ImageIcon className="w-5 h-5" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* @ts-ignore */}
              {newsletter.creative_images.map((imageUrl: string, index: number) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={imageUrl}
                    alt={`Newsletter image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center"
                  >
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                      View Full
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Recipients */}
        <DetailSection title="Recipients" icon={<Users className="w-5 h-5" />}>
          <DetailRow
            label="Recipient Type"
            value={
              newsletter.recipient_type === 'all'
                ? 'All Contacts'
                : `Selected Contacts (${newsletter.recipient_ids.length})`
            }
          />
          <DetailRow
            label="Total Recipients"
            value={newsletter.total_recipients.toString()}
          />
        </DetailSection>

        {/* Dates */}
        <DetailSection title="Timeline" icon={<Calendar className="w-5 h-5" />}>
          <DetailRow
            label="Created"
            value={new Date(newsletter.created_at).toLocaleString()}
          />
          {newsletter.scheduled_at && (
            <DetailRow
              label="Scheduled For"
              value={new Date(newsletter.scheduled_at).toLocaleString()}
            />
          )}
          {newsletter.sent_at && (
            <DetailRow
              label="Sent At"
              value={new Date(newsletter.sent_at).toLocaleString()}
            />
          )}
        </DetailSection>

        {/* Metrics (for sent newsletters) */}
        {newsletter.status === 'completed' && (
          <DetailSection title="Performance" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {newsletter.sent_count}
                </div>
                <div className="text-xs text-blue-700 mt-1">Sent</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">
                  {newsletter.opened_count || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">Opened</div>
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
                <div className="text-xs text-purple-700 mt-1">Clicked</div>
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
