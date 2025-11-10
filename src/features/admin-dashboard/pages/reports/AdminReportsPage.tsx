import { useState } from 'react';
import { type Row } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FileText, Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { DataTable } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { FormDateRangePicker } from '@/shared/components/forms/FormDateRangePicker';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/shared/lib/utils';
import type { DateRange } from '@/shared/types/common';

type ReportType = 'financial' | 'sales' | 'users' | 'shops';

interface Report {
  id: number;
  type: ReportType;
  title: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  file_url: string;
  generated_by: string;
}

interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  limit: number;
}

function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery<ReportsResponse>({
    queryKey: ['admin-reports', page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      return apiRequest<ReportsResponse>(`${API_ENDPOINTS.ADMIN.REPORTS}?${params}`);
    },
  });

  // Generate financial report
  const generateFinancialMutation = useMutation({
    mutationFn: (data: { start_date: string; end_date: string }) =>
      apiRequest(API_ENDPOINTS.ADMIN.REPORT_FINANCIAL, 'POST', data),
    onSuccess: () => {
      toast.success('Финансовый отчет успешно сгенерирован');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: () => {
      toast.error('Не удалось сгенерировать финансовый отчет');
    },
  });

  // Generate sales report
  const generateSalesMutation = useMutation({
    mutationFn: (data: { start_date: string; end_date: string }) =>
      apiRequest(API_ENDPOINTS.ADMIN.REPORT_SALES, 'POST', data),
    onSuccess: () => {
      toast.success('Отчет по продажам успешно сгенерирован');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: () => {
      toast.error('Не удалось сгенерировать отчет по продажам');
    },
  });

  const handleGenerateReport = (type: 'financial' | 'sales') => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      toast.error('Пожалуйста, выберите диапазон дат');
      return;
    }

    const data = {
      start_date: dateRange.from.toISOString(),
      end_date: dateRange.to.toISOString(),
    };

    if (type === 'financial') {
      generateFinancialMutation.mutate(data);
    } else {
      generateSalesMutation.mutate(data);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      window.open(report.file_url, '_blank');
    } catch (error) {
      toast.error('Не удалось скачать отчет');
    }
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'sales':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const columns = [
    {
      header: 'Отчет',
      accessorKey: 'title',
      cell: ({ row }: { row: Row<Report> }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {getReportIcon(row.original.type)}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.original.title}</div>
            <div className="text-sm text-gray-500 capitalize">Отчет: {row.original.type === 'financial' ? 'Финансовый' : row.original.type === 'sales' ? 'Продажи' : row.original.type}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Период',
      accessorKey: 'period_start',
      cell: ({ row }: { row: Row<Report> }) => (
        <div className="text-gray-900 dark:text-white">
          {formatDate(row.original.period_start)} - {formatDate(row.original.period_end)}
        </div>
      ),
    },
    {
      header: 'Создал',
      accessorKey: 'generated_by',
      cell: ({ row }: { row: Row<Report> }) => row.original.generated_by,
    },
    {
      header: 'Дата создания',
      accessorKey: 'generated_at',
      cell: ({ row }: { row: Row<Report> }) => formatDate(row.original.generated_at),
    },
    {
      header: 'Действия',
      accessorKey: 'id',
      cell: ({ row }: { row: Row<Report> }) => (
        <Button size="sm" variant="ghost" onClick={() => handleDownload(row.original)}>
          <Download className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Отчеты</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Генерация и скачивание отчетов платформы
          </p>
        </div>
        <BackButton to="/admin" />
      </div>

      {/* Generate Report Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Создать новый отчет
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Date Range Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Выберите диапазон дат
            </label>
            <FormDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={[
                {
                  label: 'Последние 7 дней',
                  getValue: () => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = new Date(today);
                    start.setDate(start.getDate() - 6);
                    return { from: start, to: today };
                  }
                },
                {
                  label: 'Последние 30 дней',
                  getValue: () => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const start = new Date(today);
                    start.setDate(start.getDate() - 29);
                    return { from: start, to: today };
                  }
                },
                {
                  label: 'Этот месяц',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    return { from: start, to: end };
                  }
                },
                {
                  label: 'Прошлый месяц',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const end = new Date(today.getFullYear(), today.getMonth(), 0);
                    return { from: start, to: end };
                  }
                },
                {
                  label: 'Этот год',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), 0, 1);
                    const end = new Date(today.getFullYear(), 11, 31);
                    return { from: start, to: end };
                  }
                },
              ]}
            />
          </div>

          {/* Report Type Buttons */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип отчета
            </label>
            <div className="flex gap-3">
              <Button
                onClick={() => handleGenerateReport('financial')}
                isLoading={isLoading}
                disabled={!dateRange}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Финансовый
              </Button>
              <Button
                onClick={() => handleGenerateReport('sales')}
                isLoading={isLoading}
                disabled={!dateRange}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Продажи
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            История отчетов
          </h3>
        </div>
        {reportsData?.data.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12 text-gray-400" />}
            title="Отчетов пока нет"
            message="Создайте свой первый отчет, чтобы начать"
          />
        ) : (
          <DataTable
            columns={columns}
            data={reportsData?.data || []}
            loading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
export default AdminReportsPage;
