import { useState } from 'react';
import { type Row } from '@tanstack/react-table';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShoppingBag,
  Shirt,
  UserX,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { DataTable } from '@/shared/components/ui/DataTable';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { formatDate, formatCurrency } from '@/shared/lib/utils';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  orders_count: number;
  wardrobe_count: number;
  total_spent: number;
}

interface Order {
  id: number;
  order_id: string;
  shop_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface WardrobeItem {
  id: number;
  product_name: string;
  product_image?: string;
  shop_name: string;
  added_at: string;
}

function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  // Fetch user profile
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ['admin-user', userId],
    queryFn: () => apiRequest<UserProfile>(API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)),
    enabled: !!userId,
  });

  // Fetch user orders
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['admin-user-orders', userId],
    queryFn: () =>
      apiRequest<Order[]>(`${API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)}/orders`),
    enabled: !!userId,
  });

  // Fetch user wardrobe
  const { data: wardrobeItems } = useQuery<WardrobeItem[]>({
    queryKey: ['admin-user-wardrobe', userId],
    queryFn: () =>
      apiRequest<WardrobeItem[]>(API_ENDPOINTS.ADMIN.WARDROBES_USER(userId!)),
    enabled: !!userId,
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(API_ENDPOINTS.ADMIN.USER_DELETE(userId!), 'DELETE'),
    onSuccess: () => {
      toast.success('Пользователь успешно удален');
      navigate('/admin/users');
    },
    onError: () => {
      toast.error('Не удалось удалить пользователя');
    },
  });

  // Suspend user mutation
  const suspendMutation = useMutation({
    mutationFn: () =>
      apiRequest(`${API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)}/suspend`, 'POST'),
    onSuccess: () => {
      toast.success('Пользователь успешно приостановлен');
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowSuspendDialog(false);
    },
    onError: () => {
      toast.error('Не удалось приостановить пользователя');
    },
  });

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: () =>
      apiRequest(`${API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)}/activate`, 'POST'),
    onSuccess: () => {
      toast.success('Пользователь успешно активирован');
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
    },
    onError: () => {
      toast.error('Не удалось активировать пользователя');
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Пользователь не найден</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          Назад к пользователям
        </Button>
      </div>
    );
  }

  const orderColumns = [
    {
      header: 'ID заказа',
      accessorKey: 'order_id',
    },
    {
      header: 'Магазин',
      accessorKey: 'shop_name',
    },
    {
      header: 'Сумма',
      accessorKey: 'total',
      cell: ({ row }: { row: Row<Order> }) => formatCurrency(row.original.total),
    },
    {
      header: 'Статус',
      accessorKey: 'status',
      cell: ({ row }: { row: Row<Order> }) => <StatusBadge status={row.original.status as 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'} />,
    },
    {
      header: 'Дата',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<Order> }) => formatDate(row.original.created_at),
    },
  ];

  const wardrobeColumns = [
    {
      header: 'Товар',
      accessorKey: 'product_name',
      cell: ({ row }: { row: Row<WardrobeItem> }) => (
        <div className="flex items-center gap-3">
          {row.original.product_image && (
            <img
              src={row.original.product_image}
              alt={row.original.product_name}
              className="w-12 h-12 object-cover rounded"
            />
          )}
          <span>{row.original.product_name}</span>
        </div>
      ),
    },
    {
      header: 'Магазин',
      accessorKey: 'shop_name',
    },
    {
      header: 'Добавлено',
      accessorKey: 'added_at',
      cell: ({ row }: { row: Row<WardrobeItem> }) => formatDate(row.original.added_at),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Профиль пользователя</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Просмотр и управление данными пользователя
          </p>
        </div>
        <BackButton to="/admin/users" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {user.status === 'suspended' ? (
            <Button
              onClick={() => activateMutation.mutate()}
              isLoading={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Активировать
            </Button>
          ) : (
            <Button
              onClick={() => setShowSuspendDialog(true)}
              variant="outline"
              className="text-orange-600 hover:text-orange-700"
            >
              <UserX className="w-4 h-4 mr-2" />
              Приостановить
            </Button>
          )}
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-4xl text-gray-600 dark:text-gray-300 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h2>
              <StatusBadge
                status={user.status}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Зарегистрирован {formatDate(user.created_at)}</span>
              </div>
              {user.last_login && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Последний вход {formatDate(user.last_login)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Всего заказов"
          value={user.orders_count}
          icon={<ShoppingBag className="w-6 h-6" />}
          variant="primary"
        />
        <StatsCard
          title="Товары в гардеробе"
          value={user.wardrobe_count}
          icon={<Shirt className="w-6 h-6" />}
          variant="primary"
        />
        <StatsCard
          title="Всего потрачено"
          value={formatCurrency(user.total_spent)}
          variant="success"
        />
      </div>

      {/* Orders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            История заказов
          </h3>
        </div>
        <DataTable
          columns={orderColumns}
          data={orders || []}
          emptyMessage="Пока нет заказов"
        />
      </div>

      {/* Wardrobe Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Гардероб
          </h3>
        </div>
        <DataTable
          columns={wardrobeColumns}
          data={wardrobeItems || []}
          emptyMessage="Гардероб пуст"
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Удалить пользователя"
        message={`Вы уверены, что хотите удалить ${user.name}? Это действие необратимо и приведёт к полному удалению всех данных пользователя, включая заказы и гардероб.`}
        confirmText="Удалить пользователя"
        loading={isLoading}
      />

      {/* Suspend Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={() => suspendMutation.mutate()}
        title="Приостановить пользователя"
        message={`Вы уверены, что хотите приостановить ${user.name}? Пользователь не сможет войти в свой аккаунт до повторной активации.`}
        confirmText="Приостановить"
        loading={isLoading}
      />
    </div>
  );
};
export default AdminUserProfilePage;
