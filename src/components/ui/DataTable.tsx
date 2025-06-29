import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import Skeleton from './Skeleton';

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (info: { row: T }) => React.ReactNode;
  enableSorting?: boolean;
  meta?: Record<string, any>;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortKey: string | null;
    sortDirection: 'asc' | 'desc' | null;
    onSortChange: (key: string, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
  };
  selection?: {
    selectedRows: Record<string, boolean>;
    onRowSelectionChange: (rowId: string, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
  };
  rowKey: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: T) => string);
  cellClassName?: string | ((column: Column<T>, row: T) => string);
}

function DataTable<T>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  sorting,
  filtering,
  selection,
  rowKey,
  onRowClick,
  emptyState,
  loadingState,
  errorState,
  className = '',
  tableClassName = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  cellClassName = '',
}: DataTableProps<T>) {
  const [allSelected, setAllSelected] = useState(false);

  // Reset all selected when data changes
  useEffect(() => {
    if (selection) {
      const allRowsSelected = data.length > 0 && data.every(row => {
        const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
        return selection.selectedRows[key];
      });
      setAllSelected(allRowsSelected);
    }
  }, [data, selection, rowKey]);

  // Handle select all
  const handleSelectAll = () => {
    if (selection) {
      const newValue = !allSelected;
      setAllSelected(newValue);
      selection.onSelectAll(newValue);
    }
  };

  // Get row key
  const getRowKey = (row: T): string => {
    return typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
  };

  // Get cell content
  const getCellContent = (column: Column<T>, row: T) => {
    if (column.cell) {
      return column.cell({ row });
    }
    
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    
    if (column.accessorKey) {
      return row[column.accessorKey] as React.ReactNode;
    }
    
    return null;
  };

  // Get row class name
  const getRowClassNameValue = (row: T) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row);
    }
    return rowClassName;
  };

  // Get cell class name
  const getCellClassNameValue = (column: Column<T>, row: T) => {
    if (typeof cellClassName === 'function') {
      return cellClassName(column, row);
    }
    return cellClassName;
  };

  // Render loading state
  if (loading && loadingState) {
    return loadingState;
  }

  // Render error state
  if (error && errorState) {
    return errorState;
  }

  // Render empty state
  if (!loading && data.length === 0 && emptyState) {
    return emptyState;
  }

  // Default loading state
  if (loading) {
    return (
      <div className={twMerge('w-full overflow-hidden', className)}>
        <div className="p-4 space-y-4">
          <Skeleton height={40} className="w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={50} className="w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge('w-full', className)}>
      {/* Filtering */}
      {filtering && (
        <div className="p-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filtering.globalFilter || ''}
              onChange={(e) => filtering.onGlobalFilterChange(e.target.value)}
              placeholder="Search..."
              className="pl-9 w-full"
            />
            {filtering.globalFilter && (
              <button
                onClick={() => filtering.onGlobalFilterChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={twMerge('w-full text-sm', tableClassName)}>
          <thead className={twMerge('bg-muted/50 text-muted-foreground', headerClassName)}>
            <tr>
              {selection && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-input"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={twMerge(
                    'px-4 py-3 text-left font-medium',
                    column.enableSorting && sorting ? 'cursor-pointer select-none' : ''
                  )}
                  onClick={() => {
                    if (column.enableSorting && sorting) {
                      const direction =
                        sorting.sortKey === column.id && sorting.sortDirection === 'asc'
                          ? 'desc'
                          : 'asc';
                      sorting.onSortChange(column.id, direction);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.enableSorting && sorting && sorting.sortKey === column.id && (
                      sorting.sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={twMerge('divide-y divide-border', bodyClassName)}>
            {data.map((row) => {
              const key = getRowKey(row);
              return (
                <tr
                  key={key}
                  className={twMerge(
                    'hover:bg-muted/50 transition-colors',
                    onRowClick ? 'cursor-pointer' : '',
                    selection?.selectedRows[key] ? 'bg-primary/5' : '',
                    getRowClassNameValue(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selection && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!selection.selectedRows[key]}
                        onChange={(e) => selection.onRowSelectionChange(key, e.target.checked)}
                        className="rounded border-input"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={`${key}-${column.id}`}
                      className={twMerge('px-4 py-3', getCellClassNameValue(column, row))}
                    >
                      {getCellContent(column, row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length)} of{' '}
            {data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-sm">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex === pagination.pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;