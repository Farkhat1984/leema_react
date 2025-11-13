import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { kaspiService } from '../../../services/kaspi.service';
import type { KaspiOrder, KaspiOrderStatus } from '@/shared/types/kaspi';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/feedback/Card';
import { Badge } from '@/shared/components/feedback/Badge';
import { Modal } from '@/shared/components/ui/Modal';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { KaspiProductImage } from './KaspiProductImage';

const statusSchema = z.object({
  new_status: z.enum(['ACCEPTED_BY_MERCHANT', 'COMPLETED', 'CANCELLED', 'ASSEMBLED']),
  cancellation_reason: z.enum(['BUYER_NOT_REACHABLE', 'MERCHANT_OUT_OF_STOCK']).optional(),
  cancellation_comment: z.string().max(1000).optional(),
  security_code: z.string().optional(),
  number_of_space: z.number().min(1).optional(),
});

type StatusFormData = z.infer<typeof statusSchema>;

const messageSchema = z.object({
  message_text: z.string().min(1, 'Введите сообщение').max(1000, 'Максимум 1000 символов'),
});

type MessageFormData = z.infer<typeof messageSchema>;

const statusLabels: Record<string, string> = {
  APPROVED_BY_BANK: 'Одобрен банком',
  ACCEPTED_BY_MERCHANT: 'Принят магазином',
  ASSEMBLED: 'Скомплектован',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменен',
  CANCELLING: 'Отменяется',
  RETURNED: 'Возвращен',
};

const statusColors: Record<string, string> = {
  APPROVED_BY_BANK: 'bg-blue-100 text-blue-700',
  ACCEPTED_BY_MERCHANT: 'bg-purple-100 text-purple-700',
  ASSEMBLED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CANCELLING: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-gray-100 text-gray-700',
};

interface OrderDetailViewProps {
  order: KaspiOrder;
  onBack: () => void;
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  const queryClient = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<KaspiOrderStatus | null>(null);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: StatusFormData }) =>
      kaspiService.updateOrderStatus(orderId, data),
    onSuccess: () => {
      toast.success('Статус заказа обновлен');
      queryClient.invalidateQueries({ queryKey: ['kaspi'] });
      setShowStatusModal(false);
      setSelectedStatus(null);
      statusForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка обновления статуса');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { order_id: number; message_text: string }) =>
      kaspiService.sendNotification(data),
    onSuccess: () => {
      toast.success('Сообщение отправлено');
      queryClient.invalidateQueries({ queryKey: ['kaspi', 'notifications'] });
      setShowMessageModal(false);
      messageForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка отправки сообщения');
    },
  });

  // Forms
  const statusForm = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
  });

  const messageForm = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  });

  const handleStatusChange = (status: KaspiOrderStatus) => {
    setSelectedStatus(status);
    statusForm.setValue('new_status', status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = (data: StatusFormData) => {
    updateStatusMutation.mutate({ orderId: order.id, data });
  };

  const handleSendMessage = (data: MessageFormData) => {
    sendMessageMutation.mutate({
      order_id: order.id,
      message_text: data.message_text,
    });
  };

  const needsCancellationReason = selectedStatus === 'CANCELLED';
  const needsSecurityCode = selectedStatus === 'COMPLETED';
  const needsNumberOfSpace = selectedStatus === 'ASSEMBLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к списку
          </Button>
          <div>
            <h2 className="text-xl font-bold">Заказ #{order.kaspi_order_code}</h2>
            <p className="text-gray-600 text-sm">
              Создан: {new Date(order.creation_date).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
        <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Информация о клиенте</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Имя</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Телефон</p>
                  <p className="font-medium">{order.customer_phone}</p>
                  {(order.customer_phone.includes('(000)') ||
                    order.customer_phone.includes('0000') ||
                    order.customer_phone.startsWith('+0')) && (
                    <div className="mt-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                      ⚠️ Телефон замаскирован Kaspi API. WhatsApp уведомления недоступны.
                      <br />
                      Свяжитесь с поддержкой Kaspi для получения доступа.
                    </div>
                  )}
                </div>
              </div>
              {order.delivery_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Адрес доставки</p>
                    <p className="font-medium">
                      {typeof order.delivery_address === 'object'
                        ? order.delivery_address.formattedAddress ||
                          `${order.delivery_address.town || ''}, ${order.delivery_address.streetName || ''} ${order.delivery_address.streetNumber || ''}, ${order.delivery_address.building || ''}${order.delivery_address.apartment ? ', кв. ' + order.delivery_address.apartment : ''}`.trim()
                        : order.delivery_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Products */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Товары</h3>
            <div className="space-y-3">
              {order.products_json.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  {/* Product Image */}
                  <KaspiProductImage
                    productName={product.name}
                    size="lg"
                    className="flex-shrink-0"
                  />

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-gray-600">Код: {product.code}</p>
                    <p className="text-sm text-gray-600">Количество: {product.quantity}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium">
                      {parseFloat(product.total_price).toLocaleString('ru-RU')}₸
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.quantity} × {parseFloat(product.price).toLocaleString('ru-RU')}₸
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Доставка и оплата</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Способ доставки</p>
                  <p className="font-medium">{order.delivery_mode}</p>
                  {order.is_kaspi_delivery && (
                    <Badge variant="outline" className="mt-1">
                      Доставка Kaspi
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Способ оплаты</p>
                  <p className="font-medium">{order.payment_mode}</p>
                </div>
              </div>
              {order.planned_delivery_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Плановая дата доставки</p>
                    <p className="font-medium">
                      {new Date(order.planned_delivery_date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Cancellation Info */}
          {order.status === 'CANCELLED' && order.cancellation_reason && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Причина отмены</h3>
              <p className="text-sm text-red-600 mb-2">{order.cancellation_reason}</p>
              {order.cancellation_comment && (
                <p className="text-sm text-red-600">{order.cancellation_comment}</p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Итого</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Товары:</span>
                <span className="font-medium">
                  {parseFloat(order.total_price).toLocaleString('ru-RU')}₸
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка:</span>
                <span className="font-medium">
                  {parseFloat(order.delivery_cost).toLocaleString('ru-RU')}₸
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between text-lg">
                <span className="font-semibold">Итого:</span>
                <span className="font-bold text-purple-600">
                  {parseFloat(order.total_price).toLocaleString('ru-RU')}₸
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedStatus(null);
          statusForm.reset();
        }}
        title={`Изменить статус на: ${selectedStatus ? statusLabels[selectedStatus] : ''}`}
      >
        <form onSubmit={statusForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
          {needsCancellationReason && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Причина отмены</label>
                <select
                  {...statusForm.register('cancellation_reason')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Выберите причину</option>
                  <option value="BUYER_NOT_REACHABLE">Покупатель недоступен</option>
                  <option value="MERCHANT_OUT_OF_STOCK">Товар отсутствует</option>
                </select>
              </div>
              <FormTextarea
                {...statusForm.register('cancellation_comment')}
                label="Комментарий (опционально)"
                rows={3}
                maxLength={1000}
              />
            </>
          )}

          {needsSecurityCode && (
            <div>
              <label className="block text-sm font-medium mb-2">Код безопасности</label>
              <input
                type="text"
                {...statusForm.register('security_code')}
                placeholder="Введите код"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {needsNumberOfSpace && (
            <div>
              <label className="block text-sm font-medium mb-2">Количество мест</label>
              <input
                type="number"
                min={1}
                {...statusForm.register('number_of_space', { valueAsNumber: true })}
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedStatus(null);
                statusForm.reset();
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              isLoading={updateStatusMutation.isPending}
              disabled={updateStatusMutation.isPending}
              className="flex-1"
            >
              Обновить статус
            </Button>
          </div>
        </form>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          messageForm.reset();
        }}
        title="Отправить WhatsApp сообщение"
      >
        <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Сообщение будет отправлено клиенту на номер: {order.customer_phone}
          </p>
          <FormTextarea
            {...messageForm.register('message_text')}
            label="Текст сообщения"
            rows={5}
            maxLength={1000}
            placeholder="Введите сообщение..."
            error={messageForm.formState.errors.message_text?.message}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowMessageModal(false);
                messageForm.reset();
              }}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              isLoading={sendMessageMutation.isPending}
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            >
              Отправить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
