/**
 * Admin Wardrobes Page - Simplified list of users with wardrobes
 * Features: User list with search and filtering by name, items count, and budget
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shirt, User, Search, DollarSign, Package, X } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';

interface UserWardrobe {
  user_id: number;
  user_name: string;
  user_email: string;
  item_count: number;
  total_budget: number;
}

interface WardrobeStats {
  total_items: number;
  total_users_with_items: number;
  avg_items_per_user: number;
  top_users: UserWardrobe[];
}

function WardrobesPage() {
  const [users, setUsers] = useState<UserWardrobe[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWardrobe[]>([]);
  const [stats, setStats] = useState<WardrobeStats>({
    total_items: 0,
    total_users_with_items: 0,
    avg_items_per_user: 0,
    top_users: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minItems, setMinItems] = useState('');
  const [maxItems, setMaxItems] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, minItems, maxItems, minBudget, maxBudget]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest<WardrobeStats>(
        API_ENDPOINTS.ADMIN.WARDROBES_STATS
      );
      setStats(response);
      setUsers(response.top_users || []);
    } catch (error) {
      logger.error('Failed to load wardrobe stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search by name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.user_name.toLowerCase().includes(query) ||
          user.user_email.toLowerCase().includes(query)
      );
    }

    // Filter by items count
    if (minItems) {
      filtered = filtered.filter((user) => user.item_count >= parseInt(minItems));
    }
    if (maxItems) {
      filtered = filtered.filter((user) => user.item_count <= parseInt(maxItems));
    }

    // Filter by budget
    if (minBudget) {
      filtered = filtered.filter((user) => user.total_budget >= parseInt(minBudget));
    }
    if (maxBudget) {
      filtered = filtered.filter((user) => user.total_budget <= parseInt(maxBudget));
    }

    setFilteredUsers(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setMinItems('');
    setMaxItems('');
    setMinBudget('');
    setMaxBudget('');
  };

  const columns = [
    {
      accessorKey: 'user',
      header: 'Пользователь',
      cell: ({ row }: { row: { original: UserWardrobe } }) => {
        const user = row.original;
        return (
          <Link
            to={`${ROUTES.ADMIN.WARDROBES}/user/${user.user_id}`}
            className="flex items-center gap-3 hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.user_name}</div>
              <div className="text-sm text-gray-500">{user.user_email}</div>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: 'item_count',
      header: 'Количество вещей',
      cell: ({ row }: { row: { original: UserWardrobe } }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-gray-900">{user.item_count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'total_budget',
      header: 'Бюджет гардероба',
      cell: ({ row }: { row: { original: UserWardrobe } }) => {
        const user = row.original;
        const budget = user.total_budget ?? 0;
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-gray-900">
              {budget > 0 ? `${budget.toLocaleString('ru-RU')} ₸` : '—'}
            </span>
          </div>
        );
      },
    },
  ];

  const activeFiltersCount = [searchQuery, minItems, maxItems, minBudget, maxBudget].filter(
    Boolean
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.ADMIN.DASHBOARD}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <Shirt className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Гардеробы пользователей</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Всего пользователей"
              value={stats.total_users_with_items}
              icon="users"
            />
            <StatsCard
              title="Всего вещей"
              value={stats.total_items}
              icon="tshirt"
            />
            <StatsCard
              title="Среднее на пользователя"
              value={stats.avg_items_per_user.toFixed(1)}
              icon="box"
            />
          </div>

          {/* Search and Filters */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  Поиск и фильтры
                </h3>
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Активных фильтров: {activeFiltersCount}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Сбросить
                    </Button>
                  </div>
                )}
              </div>

              {/* Search by name/email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск по имени или email
                </label>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Введите имя или email..."
                />
              </div>

              {/* Filter by items count and budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Items count range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество вещей
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minItems}
                      onChange={(e) => setMinItems(e.target.value)}
                      placeholder="От"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      value={maxItems}
                      onChange={(e) => setMaxItems(e.target.value)}
                      placeholder="До"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>

                {/* Budget range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Бюджет гардероба (₸)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value)}
                      placeholder="От"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <span className="text-gray-500">—</span>
                    <input
                      type="number"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      placeholder="До"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Пользователи ({filteredUsers.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="w-8 h-8 text-purple-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon="users"
                title="Пользователи не найдены"
                description={
                  activeFiltersCount > 0
                    ? 'Попробуйте изменить параметры фильтрации'
                    : 'Пользователи с гардеробами появятся здесь'
                }
              />
            ) : (
              <DataTable data={filteredUsers} columns={columns} loading={isLoading} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default WardrobesPage;
