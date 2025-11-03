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
      toast.success('User deleted successfully');
      navigate('/admin/users');
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  // Suspend user mutation
  const suspendMutation = useMutation({
    mutationFn: () =>
      apiRequest(`${API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)}/suspend`, 'POST'),
    onSuccess: () => {
      toast.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowSuspendDialog(false);
    },
    onError: () => {
      toast.error('Failed to suspend user');
    },
  });

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: () =>
      apiRequest(`${API_ENDPOINTS.ADMIN.USER_BY_ID(userId!)}/activate`, 'POST'),
    onSuccess: () => {
      toast.success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
    },
    onError: () => {
      toast.error('Failed to activate user');
    },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  const orderColumns = [
    {
      header: 'Order ID',
      accessorKey: 'order_id',
    },
    {
      header: 'Shop',
      accessorKey: 'shop_name',
    },
    {
      header: 'Total',
      accessorKey: 'total',
      cell: ({ row }: { row: Row<Order> }) => formatCurrency(row.original.total),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: Row<Order> }) => <StatusBadge status={row.original.status as 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'} />,
    },
    {
      header: 'Date',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<Order> }) => formatDate(row.original.created_at),
    },
  ];

  const wardrobeColumns = [
    {
      header: 'Product',
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
      header: 'Shop',
      accessorKey: 'shop_name',
    },
    {
      header: 'Added',
      accessorKey: 'added_at',
      cell: ({ row }: { row: Row<WardrobeItem> }) => formatDate(row.original.added_at),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage user details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 'suspended' ? (
            <Button
              onClick={() => activateMutation.mutate()}
              isLoading={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Activate User
            </Button>
          ) : (
            <Button
              onClick={() => setShowSuspendDialog(true)}
              variant="outline"
              className="text-orange-600 hover:text-orange-700"
            >
              <UserX className="w-4 h-4 mr-2" />
              Suspend User
            </Button>
          )}
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
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
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
              {user.last_login && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Last login {formatDate(user.last_login)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Orders"
          value={user.orders_count}
          icon={<ShoppingBag className="w-6 h-6" />}
          variant="primary"
        />
        <StatsCard
          title="Wardrobe Items"
          value={user.wardrobe_count}
          icon={<Shirt className="w-6 h-6" />}
          variant="primary"
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(user.total_spent)}
          variant="success"
        />
      </div>

      {/* Orders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Order History
          </h3>
        </div>
        <DataTable
          columns={orderColumns}
          data={orders || []}
          emptyMessage="No orders yet"
        />
      </div>

      {/* Wardrobe Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wardrobe Items
          </h3>
        </div>
        <DataTable
          columns={wardrobeColumns}
          data={wardrobeItems || []}
          emptyMessage="No wardrobe items"
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone and will permanently remove all user data including orders and wardrobe items.`}
        confirmText="Delete User"
        loading={isLoading}
      />

      {/* Suspend Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={() => suspendMutation.mutate()}
        title="Suspend User"
        message={`Are you sure you want to suspend ${user.name}? They will not be able to access their account until reactivated.`}
        confirmText="Suspend User"
        loading={isLoading}
      />
    </div>
  );
};
export default AdminUserProfilePage;
