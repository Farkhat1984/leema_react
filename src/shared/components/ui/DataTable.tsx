import React, { type ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { logger } from '@/shared/lib/utils/logger';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  // Pagination
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  totalRows?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  manualPagination?: boolean;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  manualSorting?: boolean;
  // Filtering
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  manualFiltering?: boolean;
  // Row selection
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  getRowId?: (row: TData, index: number) => string;
  // Bulk actions
  bulkActions?: ReactNode;
  // UI
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  showPagination?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string;
}

export function DataTable<TData>({
  columns,
  data,
  pageSize = 10,
  pageIndex = 0,
  pageCount,
  totalRows,
  onPaginationChange,
  manualPagination = false,
  sorting = [],
  onSortingChange,
  manualSorting = false,
  columnFilters = [],
  onColumnFiltersChange,
  manualFiltering = false,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  getRowId,
  bulkActions,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  className = '',
  stickyHeader = false,
  showPagination = true,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  rowClassName,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(sorting);
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>(columnFilters);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>(rowSelection);

  // Ensure data is always an array
  const safeData = React.useMemo(() => data || [], [data]);

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    onSortingChange: (updaterOrValue) => {
      if (manualSorting && onSortingChange) {
        const newValue = typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue;
        onSortingChange(newValue);
      } else {
        setInternalSorting(updaterOrValue);
      }
    },
    onColumnFiltersChange: (updaterOrValue) => {
      if (manualFiltering && onColumnFiltersChange) {
        const newValue = typeof updaterOrValue === 'function'
          ? updaterOrValue(columnFilters)
          : updaterOrValue;
        onColumnFiltersChange(newValue);
      } else {
        setInternalColumnFilters(updaterOrValue);
      }
    },
    onColumnVisibilityChange: setInternalColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      if (onRowSelectionChange) {
        const newValue = typeof updaterOrValue === 'function'
          ? updaterOrValue(rowSelection)
          : updaterOrValue;
        onRowSelectionChange(newValue);
      } else {
        setInternalRowSelection(updaterOrValue);
      }
    },
    getRowId,
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      sorting: manualSorting ? sorting : internalSorting,
      columnFilters: manualFiltering ? columnFilters : internalColumnFilters,
      columnVisibility: internalColumnVisibility,
      rowSelection: onRowSelectionChange ? rowSelection : internalRowSelection,
      // ALWAYS provide pagination state - tanstack-table requires it
      ...(manualPagination && {
        pagination: { pageIndex, pageSize }
      })
    },
    enableRowSelection,
    initialState: {
      pagination: {
        pageSize,
        pageIndex,
      },
    },
  });

  const selectedRowsCount = Object.keys(
    onRowSelectionChange ? rowSelection : internalRowSelection
  ).length;

  const handlePageChange = (newPageIndex: number) => {
    if (manualPagination) {
      onPaginationChange?.(newPageIndex, pageSize);
    } else {
      table.setPageIndex(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (manualPagination) {
      onPaginationChange?.(0, newPageSize);
    } else {
      table.setPageSize(newPageSize);
    }
  };

  const currentPageIndex = manualPagination ? pageIndex : table.getState().pagination?.pageIndex ?? 0;
  const currentPageSize = manualPagination ? pageSize : table.getState().pagination?.pageSize ?? pageSize;
  
  // Safely get total pages
  let totalPages = 0;
  try {
    totalPages = manualPagination ? (pageCount || 0) : (table.getPageCount?.() || 0);
  } catch (error) {
    logger.warn('[DataTable] Error getting page count', error);
    totalPages = 0;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Bulk Actions Bar */}
      {enableRowSelection && selectedRowsCount > 0 && bulkActions && (
        <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-indigo-900">
            {selectedRowsCount} row{selectedRowsCount > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">{bulkActions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center space-x-1 cursor-pointer select-none hover:text-gray-700'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="w-4 h-4" />
                            ) : (
                              <ArrowUpDown className="w-4 h-4 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState title={emptyMessage} message="" icon={emptyIcon} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${rowClassName ? rowClassName(row.original) : ''}
                  `}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && !loading && data.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showPageSizeSelector && (
              <>
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={currentPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPageIndex + 1} of {totalPages}
              {totalRows && ` (${totalRows} total)`}
            </span>

            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(0)}
                disabled={currentPageIndex === 0}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPageIndex + 1)}
                disabled={currentPageIndex >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPageIndex >= totalPages - 1}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for creating checkbox column
export const createCheckboxColumn = <TData,>(): ColumnDef<TData, unknown> => ({
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
    />
  ),
  enableSorting: false,
  enableHiding: false,
});
