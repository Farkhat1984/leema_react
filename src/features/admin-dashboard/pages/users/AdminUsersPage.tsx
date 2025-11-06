import { useState } from 'react';
import { type Row } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { managementService } from '@/features/admin-dashboard/services';
import { DataTable } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/lib/utils';
import UserProfileModal from './UserProfileModal';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch users
  const { data: usersData, isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => managementService.getUsers(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const columns = [
    {
      header: 'User',
      accessorKey: 'name',
      cell: ({ row }: { row: Row<User> }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar_url ? (
            <img
              src={row.original.avatar_url}
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
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<User> }) => formatDate(row.original.created_at),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }: { row: Row<User> }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelectedUserId(row.original.id)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View mobile app users
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <DataTable
          columns={columns}
          data={usersData || []}
          loading={isLoading}
        />
      </div>

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
