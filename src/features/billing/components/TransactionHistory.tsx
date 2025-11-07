/**
 * Transaction History Component
 *
 * @description Displays transaction history with filtering
 */

import { useState } from 'react';
import { formatNumber } from '@/shared/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Filter } from 'lucide-react';
import { useTransactions } from '../hooks/useBilling';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Transaction, TransactionType, TransactionStatus } from '../types';

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  'top-up': 'Пополнение',
  rent: 'Аренда слота',
  refund: 'Возврат',
  withdrawal: 'Вывод средств',
  purchase: 'Покупка',
};

const TRANSACTION_STATUS_COLORS: Record<
  TransactionStatus,
  'success' | 'warning' | 'danger' | 'info'
> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  cancelled: 'info',
};

export function TransactionHistory() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTransactions({
    type: typeFilter,
    page,
    limit: 20,
  });

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'created_at',
      header: 'Дата',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {new Date(row.original.created_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Тип',
      cell: ({ row }) => {
        const isPositive = ['top-up', 'refund'].includes(row.original.type);
        return (
          <div className="flex items-center gap-2">
            {isPositive ? (
              <ArrowUpCircle className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {TRANSACTION_TYPE_LABELS[row.original.type]}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Описание',
      cell: ({ row }) => (
        <div className="max-w-xs text-sm text-gray-600 truncate">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Сумма',
      cell: ({ row }) => {
        const isPositive = ['top-up', 'refund'].includes(row.original.type);
        return (
          <div
            className={`text-sm font-semibold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? '+' : '-'}
            {formatNumber(row.original.amount)} KZT
          </div>
        );
      },
    },
    {
      accessorKey: 'balance_after',
      header: 'Баланс после',
      cell: ({ row }) => (
        <div className="text-sm text-gray-700 font-medium">
          {formatNumber(row.original.balance_after)} KZT
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          variant={TRANSACTION_STATUS_COLORS[row.original.status]}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={typeFilter || ''}
          onChange={(e) => {
            setTypeFilter((e.target.value as TransactionType) || undefined);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Все типы</option>
          {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {typeFilter && (
          <button
            onClick={() => {
              setTypeFilter(undefined);
              setPage(1);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Очистить фильтр
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.transactions || []}
        loading={isLoading}
        pageSize={20}
        pageIndex={page - 1}
        pageCount={Math.ceil((data?.total || 0) / 20)}
        totalRows={data?.total || 0}
        onPaginationChange={(pageIndex) => setPage(pageIndex + 1)}
        manualPagination
      />
    </div>
  );
}
