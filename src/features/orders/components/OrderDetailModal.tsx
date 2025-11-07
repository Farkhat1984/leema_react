import { DetailModal, DetailRow, DetailSection } from '@/shared/components/ui/DetailModal'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import {
  Package,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { ordersService } from '../services/orders.service'
import type { Order } from '../types/order.types'

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

const STATUS_CONFIG = {
  pending: { label: 'Ожидание', color: 'gray' as const },
  paid: { label: 'Оплачено', color: 'green' as const },
  shipped: { label: 'Отправлено', color: 'blue' as const },
  completed: { label: 'Завершено', color: 'green' as const },
  cancelled: { label: 'Отменено', color: 'red' as const },
  refunded: { label: 'Возврат', color: 'yellow' as const },
}

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!order) return null

  const statusConfig = STATUS_CONFIG[order.status]

  return (
    <DetailModal isOpen={isOpen} onClose={onClose} title="Детали заказа" size="xl">
      <div className="space-y-6">
        {/* Order Info */}
        <DetailSection title="Информация о заказе" icon={<Package className="w-5 h-5" />}>
          <DetailRow
            label="Номер заказа"
            value={ordersService.formatOrderNumber(order.order_number)}
          />
          <DetailRow
            label="Статус"
            value={<StatusBadge status={order.status} variant={statusConfig.color} />}
          />
          <DetailRow
            label="Дата заказа"
            value={new Date(order.ordered_at).toLocaleString('ru-RU')}
          />
          {order.notes && <DetailRow label="Примечания" value={order.notes} />}
        </DetailSection>

        {/* Customer Info */}
        <DetailSection title="Информация о клиенте" icon={<User className="w-5 h-5" />}>
          <DetailRow label="Имя" value={order.customer.name} />
          <DetailRow label="Email" value={order.customer.email} />
          <DetailRow label="Телефон" value={order.customer.phone} />
        </DetailSection>

        {/* Shipping Address */}
        <DetailSection title="Адрес доставки" icon={<MapPin className="w-5 h-5" />}>
          <div className="text-sm text-gray-900">
            <p>{order.customer.address}</p>
            {order.customer.city && (
              <p>
                {order.customer.city}
                {order.customer.postal_code && `, ${order.customer.postal_code}`}
              </p>
            )}
            {order.customer.country && <p>{order.customer.country}</p>}
          </div>
        </DetailSection>

        {/* Products */}
        <DetailSection title="Товары" icon={<ShoppingBag className="w-5 h-5" />}>
          <div className="space-y-3">
            {order.products.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {product.product_image && (
                  <img
                    src={product.product_image}
                    alt={product.product_name}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.product_name}</div>
                  {(product.size || product.color) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {product.size && <span>Размер: {product.size}</span>}
                      {product.size && product.color && <span> • </span>}
                      {product.color && <span>Цвет: {product.color}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Кол-во: {product.quantity}</div>
                  <div className="font-medium text-gray-900">
                    {ordersService.formatCurrency(product.price)}
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  {ordersService.formatCurrency(product.price * product.quantity)}
                </div>
              </div>
            ))}
          </div>
        </DetailSection>

        {/* Payment Summary */}
        <DetailSection title="Сводка по оплате" icon={<CreditCard className="w-5 h-5" />}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Сумма товаров:</span>
              <span className="text-gray-900">
                {ordersService.formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Доставка:</span>
              <span className="text-gray-900">
                {ordersService.formatCurrency(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Налог:</span>
              <span className="text-gray-900">{ordersService.formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Итого:</span>
              <span className="text-blue-600">{ordersService.formatCurrency(order.total)}</span>
            </div>
          </div>
          <DetailRow label="Способ оплаты" value={order.payment_method} />
          {order.payment_id && <DetailRow label="ID платежа" value={order.payment_id} />}
        </DetailSection>

        {/* Timeline */}
        <DetailSection title="Хронология заказа" icon={<Calendar className="w-5 h-5" />}>
          <div className="space-y-3">
            <TimelineItem
              label="Заказан"
              date={order.ordered_at}
              completed
            />
            <TimelineItem
              label="Оплачен"
              date={order.paid_at}
              completed={!!order.paid_at}
            />
            <TimelineItem
              label="Отправлен"
              date={order.shipped_at}
              completed={!!order.shipped_at}
            />
            <TimelineItem
              label="Завершен"
              date={order.completed_at}
              completed={!!order.completed_at}
            />
            {order.cancelled_at && (
              <TimelineItem
                label="Отменен"
                date={order.cancelled_at}
                completed
                cancelled
              />
            )}
          </div>
        </DetailSection>

        {/* Admin-only: Platform Fee */}
        {order.platform_fee && order.shop_payout && (
          <DetailSection title="Детали платформы">
            <DetailRow
              label="Комиссия платформы"
              value={ordersService.formatCurrency(order.platform_fee)}
            />
            <DetailRow
              label="Выплата магазину"
              value={ordersService.formatCurrency(order.shop_payout)}
            />
            {order.shop_name && <DetailRow label="Магазин" value={order.shop_name} />}
          </DetailSection>
        )}
      </div>
    </DetailModal>
  )
}

// Timeline Item Component
interface TimelineItemProps {
  label: string
  date?: string
  completed: boolean
  cancelled?: boolean
}

function TimelineItem({ label, date, completed, cancelled = false }: TimelineItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          completed
            ? cancelled
              ? 'bg-red-100'
              : 'bg-green-100'
            : 'bg-gray-100'
        }`}
      >
        {completed && (
          <CheckCircle2
            className={`w-4 h-4 ${cancelled ? 'text-red-600' : 'text-green-600'}`}
          />
        )}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${completed ? 'text-gray-900' : 'text-gray-400'}`}>
          {label}
        </div>
        {date && (
          <div className="text-xs text-gray-500">{new Date(date).toLocaleString('ru-RU')}</div>
        )}
      </div>
    </div>
  )
}
