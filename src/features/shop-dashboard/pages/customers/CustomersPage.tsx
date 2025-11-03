/**
 * Shop Customers Page - View and manage shop customers
 * Displays customer list with orders and statistics
 */

import { useState, useEffect } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { Link } from 'react-router-dom';
import { logger } from '@/shared/lib/utils/logger';
import { ArrowLeft, Users as UsersIcon, Download } from 'lucide-react';
import { logger } from '@/shared/lib/utils/logger';
import { apiRequest } from '@/shared/lib/api/client';
import { logger } from '@/shared/lib/utils/logger';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/lib/utils/logger';
import { ROUTES } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';
import { Card } from '@/shared/components/feedback/Card';
import { logger } from '@/shared/lib/utils/logger';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { logger } from '@/shared/lib/utils/logger';
import { DataTable } from '@/shared/components/ui/DataTable';
import { logger } from '@/shared/lib/utils/logger';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { logger } from '@/shared/lib/utils/logger';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { logger } from '@/shared/lib/utils/logger';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { logger } from '@/shared/lib/utils/logger';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}

interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  averageOrders: number;
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newThisMonth: 0,
    activeCustomers: 0,
    averageOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await apiRequest<CustomersResponse>(
        `${API_ENDPOINTS.SHOPS.ME}/customers?${params}`
      );

      setCustomers(response.data);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error) {
      logger.error('Failed to load customers', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiRequest<CustomerStats>(
        `${API_ENDPOINTS.SHOPS.ME}/customers/stats`
      );
      setStats(response);
    } catch (error) {
      logger.error('Failed to load customer stats', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Имя',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <span className="text-gray-600">
            {customer.phone || '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalOrders',
      header: 'Заказов',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <span className="font-medium text-gray-900">{customer.totalOrders}</span>
        );
      },
    },
    {
      accessorKey: 'totalSpent',
      header: 'Потрачено',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <span className="font-medium text-green-600">
            {customer.totalSpent.toLocaleString('ru-RU')} ₸
          </span>
        );
      },
    },
    {
      accessorKey: 'lastOrderDate',
      header: 'Последний заказ',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <span className="text-gray-600">
            {customer.lastOrderDate
              ? new Date(customer.lastOrderDate).toLocaleDateString('ru-RU')
              : 'Нет заказов'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Регистрация',
      cell: ({row}: {row: {original: Customer}}) => {
        const customer = row.original;
        return (
          <span className="text-gray-600">
            {new Date(customer.createdAt).toLocaleDateString('ru-RU')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.SHOP.DASHBOARD}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <i className="Users className="w-5 h-5 text-purple-600 text-2xl mr-3 />
                <span className="text-xl font-bold text-gray-900">Клиенты</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Всего клиентов"
            value={stats.totalCustomers}
            icon="users"
          />
          <StatsCard
            title="Новых за месяц"
            value={stats.newThisMonth}
            icon="user-plus"
          />
          <StatsCard
            title="Активных"
            value={stats.activeCustomers}
            icon="star"
          />
          <StatsCard
            title="Средний чек"
            value={`${stats.averageOrders.toLocaleString('ru-RU')} ₸`}
            icon="wallet"
          />
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Поиск по имени, email или телефону..."
              />
            </div>
          </div>
        </Card>

        {/* Customers Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Список клиентов
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-purple-600" />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon="users"
              title="Клиентов пока нет"
              description={
                searchQuery
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Когда кто-то сделает заказ, они появятся здесь'
              }
            />
          ) : (
            <DataTable
              data={customers}
              columns={columns}
              loading={isLoading}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CustomersPage;
