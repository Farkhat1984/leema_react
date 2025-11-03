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
  pending: { label: 'Pending', color: 'gray' as const },
  paid: { label: 'Paid', color: 'green' as const },
  shipped: { label: 'Shipped', color: 'blue' as const },
  completed: { label: 'Completed', color: 'green' as const },
  cancelled: { label: 'Cancelled', color: 'red' as const },
  refunded: { label: 'Refunded', color: 'yellow' as const },
}

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!order) return null

  const statusConfig = STATUS_CONFIG[order.status]

  return (
    <DetailModal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        {/* Order Info */}
        <DetailSection title="Order Information" icon={<Package className="w-5 h-5" />}>
          <DetailRow
            label="Order Number"
            value={ordersService.formatOrderNumber(order.order_number)}
          />
          <DetailRow
            label="Status"
            value={<StatusBadge status={order.status} variant={statusConfig.color} />}
          />
          <DetailRow
            label="Order Date"
            value={new Date(order.ordered_at).toLocaleString()}
          />
          {order.notes && <DetailRow label="Notes" value={order.notes} />}
        </DetailSection>

        {/* Customer Info */}
        <DetailSection title="Customer Information" icon={<User className="w-5 h-5" />}>
          <DetailRow label="Name" value={order.customer.name} />
          <DetailRow label="Email" value={order.customer.email} />
          <DetailRow label="Phone" value={order.customer.phone} />
        </DetailSection>

        {/* Shipping Address */}
        <DetailSection title="Shipping Address" icon={<MapPin className="w-5 h-5" />}>
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
        <DetailSection title="Products" icon={<ShoppingBag className="w-5 h-5" />}>
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
                      {product.size && <span>Size: {product.size}</span>}
                      {product.size && product.color && <span> • </span>}
                      {product.color && <span>Color: {product.color}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Qty: {product.quantity}</div>
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
        <DetailSection title="Payment Summary" icon={<CreditCard className="w-5 h-5" />}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">
                {ordersService.formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping:</span>
              <span className="text-gray-900">
                {ordersService.formatCurrency(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900">{ordersService.formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">{ordersService.formatCurrency(order.total)}</span>
            </div>
          </div>
          <DetailRow label="Payment Method" value={order.payment_method} />
          {order.payment_id && <DetailRow label="Payment ID" value={order.payment_id} />}
        </DetailSection>

        {/* Timeline */}
        <DetailSection title="Order Timeline" icon={<Calendar className="w-5 h-5" />}>
          <div className="space-y-3">
            <TimelineItem
              label="Ordered"
              date={order.ordered_at}
              completed
            />
            <TimelineItem
              label="Paid"
              date={order.paid_at}
              completed={!!order.paid_at}
            />
            <TimelineItem
              label="Shipped"
              date={order.shipped_at}
              completed={!!order.shipped_at}
            />
            <TimelineItem
              label="Completed"
              date={order.completed_at}
              completed={!!order.completed_at}
            />
            {order.cancelled_at && (
              <TimelineItem
                label="Cancelled"
                date={order.cancelled_at}
                completed
                cancelled
              />
            )}
          </div>
        </DetailSection>

        {/* Admin-only: Platform Fee */}
        {order.platform_fee && order.shop_payout && (
          <DetailSection title="Platform Details">
            <DetailRow
              label="Platform Fee"
              value={ordersService.formatCurrency(order.platform_fee)}
            />
            <DetailRow
              label="Shop Payout"
              value={ordersService.formatCurrency(order.shop_payout)}
            />
            {order.shop_name && <DetailRow label="Shop" value={order.shop_name} />}
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
          <div className="text-xs text-gray-500">{new Date(date).toLocaleString()}</div>
        )}
      </div>
    </div>
  )
}
