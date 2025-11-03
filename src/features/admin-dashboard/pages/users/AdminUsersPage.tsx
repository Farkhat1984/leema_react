import { useState } from 'react';
import { type Row } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Trash2, Eye, UserX, UserCheck } from 'lucide-react';
import { managementService } from '@/features/admin-dashboard/services';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { useDebounce } from '@/shared/hooks';
import { formatDate } from '@/shared/lib/utils';

interface User {
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
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

interface StatsResponse {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users using managementService
  const { data: usersData, isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users', page, debouncedSearch, statusFilter],
    queryFn: () => managementService.getUsers({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Compute stats from usersData (or fetch separately if backend provides)
  const stats: StatsResponse = {
    total: usersData?.length || 0,
    active: usersData?.filter(u => u.status === 'active').length || 0,
    inactive: usersData?.filter(u => u.status === 'inactive').length || 0,
    suspended: usersData?.filter(u => u.status === 'suspended').length || 0,
  };

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      managementService.blockUser(userId, reason),
    onSuccess: () => {
      toast.success('Пользователь заблокирован');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSuspendUserId(null);
    },
    onError: () => {
      toast.error('Не удалось заблокировать пользователя');
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: number) => managementService.unblockUser(userId),
    onSuccess: () => {
      toast.success('Пользователь разблокирован');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast.error('Не удалось разблокировать пользователя');
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: number) => managementService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Пользователь удален');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeleteUserId(null);
    },
    onError: () => {
      toast.error('Не удалось удалить пользователя');
    },
  });

  const columns = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: ({ row }: { row: Row<User> }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar ? (
            <img
              src={row.original.avatar}
              alt={row.original.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ row }: { row: Row<User> }) => row.original.phone || '—',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: { row: Row<User> }) => (
        <StatusBadge
          status={row.original.status}
        />
      ),
    },
    {
      header: 'Orders',
      accessorKey: 'orders_count',
      cell: ({ row }: { row: Row<User> }) => row.original.orders_count || 0,
    },
    {
      header: 'Wardrobe Items',
      accessorKey: 'wardrobe_count',
      cell: ({ row }: { row: Row<User> }) => row.original.wardrobe_count || 0,
    },
    {
      header: 'Last Login',
      accessorKey: 'last_login',
      cell: ({ row }: { row: Row<User> }) => (row.original.last_login ? formatDate(row.original.last_login) : 'Never'),
    },
    {
      header: 'Joined',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<User> }) => formatDate(row.original.created_at),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }: { row: Row<User> }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/admin/users/${row.original.id}`, '_blank')}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'active' || row.original.status === 'inactive' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSuspendUserId(row.original.id)}
              className="text-orange-600 hover:text-orange-700"
            >
              <UserX className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => activateMutation.mutate(row.original.id)}
              className="text-green-600 hover:text-green-700"
              isLoading={isLoading}
            >
              <UserCheck className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteUserId(row.original.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage platform users, view profiles, and moderate accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.total || 0}
          variant="primary"
        />
        <StatsCard
          title="Active Users"
          value={stats?.active || 0}
          variant="success"
        />
        <StatsCard
          title="Inactive Users"
          value={stats?.inactive || 0}
          variant="primary"
        />
        <StatsCard
          title="Suspended Users"
          value={stats?.suspended || 0}
          variant="danger"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or email..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {(searchQuery || statusFilter !== 'all') && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <DataTable
          columns={columns}
          data={usersData || []}
          loading={isLoading}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteUserId !== null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteUserId(null)}
          onConfirm={() => deleteMutation.mutate(deleteUserId)}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone and will remove all user data including orders and wardrobe items."
          confirmText="Delete"
          loading={isLoading}
        />
      )}

      {/* Block User Modal */}
      {suspendUserId !== null && (
        <RejectModal
          isOpen={true}
          onClose={() => setSuspendUserId(null)}
          onSubmit={(reason) => blockMutation.mutate({ userId: suspendUserId, reason })}
          title="Block User"
          description="Please provide a reason for blocking this user. They will not be able to access their account until unblocked."
          submitText="Block User"
          loading={blockMutation.isPending}
        />
      )}
    </div>
  );
};
export default AdminUsersPage;
