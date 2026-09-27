/**
 * DataTable Component
 * Sortable, paginated table with sticky header and status badges
 *
 * @example
 * interface Agent {
 *   id: string;
 *   name: string;
 *   status: 'active' | 'idle' | 'failed';
 * }
 *
 * const columns: DataTableColumn<Agent>[] = [
 *   { key: 'id', label: 'Agent ID', width: '120px' },
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'status', label: 'Status', render: (agent) => (
 *     <StatusBadge status={agent.status} />
 *   )}
 * ];
 *
 * <DataTable
 *   data={agents}
 *   columns={columns}
 *   sortBy="name"
 *   onSort={(key, direction) => { /* ... *\/ }}
 * />
 */

import React, { useMemo, useState, useCallback } from 'react';
import styles from './DataTable.module.css';

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  isLoading?: boolean;
  sortBy?: keyof T | null;
  sortDirection?: SortDirection;
  onSort?: (key: keyof T, direction: SortDirection) => void;
  onPageChange?: (page: number) => void;
  getRowKey?: (item: T, index: number) => string;
  emptyState?: React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
}

/**
 * Sorts an array of items based on the given key and direction
 */
function getSortedData<T extends Record<string, any>>(
  data: T[],
  sortBy: keyof T | null,
  sortDirection: SortDirection
): T[] {
  if (!sortBy || !sortDirection) return data;

  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    // Handle nullish values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
    if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    // Number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      const cmp = aVal.getTime() - bVal.getTime();
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    // Fallback: string coercion
    const aStr = String(aVal);
    const bStr = String(bVal);
    const cmp = aStr.localeCompare(bStr);
    return sortDirection === 'asc' ? cmp : -cmp;
  });
}

/**
 * DataTable: Reusable table component with sorting, pagination, and status badges
 */
export const DataTable = React.forwardRef<
  HTMLTableElement,
  DataTableProps<any>
>(
  (
    {
      data,
      columns,
      pageSize = 10,
      isLoading = false,
      sortBy = null,
      sortDirection = null,
      onSort,
      onPageChange,
      getRowKey = (item, index) => String(item.id ?? index),
      emptyState,
      selectable = false,
      onSelectionChange,
    },
    ref
  ) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Sort data
    const sortedData = useMemo(
      () => getSortedData(data, sortBy, sortDirection),
      [data, sortBy, sortDirection]
    );

    // Paginate data
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
      const start = (currentPage - 1) * pageSize;
      return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handle sort
    const handleSort = useCallback(
      (key: keyof typeof columns[0]) => {
        if (!onSort) return;

        let newDirection: SortDirection = 'asc';
        if (sortBy === key && sortDirection === 'asc') {
          newDirection = 'desc';
        } else if (sortBy === key && sortDirection === 'desc') {
          newDirection = null;
        }

        onSort(key, newDirection);
        setCurrentPage(1); // Reset to first page on sort
      },
      [sortBy, sortDirection, onSort]
    );

    // Handle page change
    const handlePageChange = useCallback(
      (page: number) => {
        setCurrentPage(page);
        onPageChange?.(page);
      },
      [onPageChange]
    );

    // Handle selection
    const handleSelectAll = useCallback(
      (checked: boolean) => {
        const newSelected = new Set(selectedRows);
        paginatedData.forEach((item, index) => {
          const key = getRowKey(item, index);
          if (checked) {
            newSelected.add(key);
          } else {
            newSelected.delete(key);
          }
        });
        setSelectedRows(newSelected);
        if (onSelectionChange) {
          const selectedItems = paginatedData.filter(
            (item, index) => newSelected.has(getRowKey(item, index))
          );
          onSelectionChange(selectedItems);
        }
      },
      [paginatedData, selectedRows, getRowKey, onSelectionChange]
    );

    const handleSelectRow = useCallback(
      (rowKey: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowKey)) {
          newSelected.delete(rowKey);
        } else {
          newSelected.add(rowKey);
        }
        setSelectedRows(newSelected);
        if (onSelectionChange) {
          const selectedItems = paginatedData.filter(
            (item, index) => newSelected.has(getRowKey(item, index))
          );
          onSelectionChange(selectedItems);
        }
      },
      [selectedRows, paginatedData, getRowKey, onSelectionChange]
    );

    const allPageItemsSelected =
      paginatedData.length > 0 &&
      paginatedData.every((item, index) =>
        selectedRows.has(getRowKey(item, index))
      );

    // Loading state
    if (isLoading) {
      return (
        <div className={styles.root}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  {selectable && (
                    <th className={styles.th} style={{ width: '40px' }}>
                      □
                    </th>
                  )}
                  {columns.map((col) => (
                    <th key={String(col.key)} className={styles.th} style={{ width: col.width }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className={styles.tr}>
                    {selectable && (
                      <td className={styles.td}>
                        <div
                          className={styles.skeleton}
                          style={{ width: '20px', height: '20px' }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className={styles.td}>
                        <div
                          className={styles.skeleton}
                          style={{ height: '16px', width: '60%' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Empty state
    if (data.length === 0) {
      return (
        <div className={styles.root}>
          {emptyState || (
            <div style={{ textAlign: 'center', padding: 'var(--vf-space-8)' }}>
              <p style={{ color: 'var(--vf-text-muted)' }}>No data available</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={styles.root}>
        <div className={styles.tableContainer}>
          <table className={styles.table} ref={ref}>
            <thead className={styles.thead}>
              <tr>
                {selectable && (
                  <th className={styles.th} style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allPageItemsSelected}
                      onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                      aria-label="Select all items"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isSortable = col.sortable !== false && onSort;
                  const isSorted = sortBy === col.key;
                  const isActive = isSorted && sortDirection;

                  return (
                    <th
                      key={String(col.key)}
                      className={`${styles.th} ${isSortable ? styles.sortable : ''} ${
                        isActive ? styles.sortActive : ''
                      }`}
                      style={{ width: col.width }}
                    >
                      {isSortable ? (
                        <button
                          className={styles.sortableButton}
                          onClick={() =>
                            handleSort(col.key as unknown as keyof typeof columns[0])
                          }
                          aria-label={`Sort by ${col.label}`}
                        >
                          {col.label}
                          <span className={styles.sortIcon}>
                            {isSorted && sortDirection === 'asc' && '↑'}
                            {isSorted && sortDirection === 'desc' && '↓'}
                            {!isActive && '⋮'}
                          </span>
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {paginatedData.map((item, index) => {
                const rowKey = getRowKey(item, index);
                const isSelected = selectedRows.has(rowKey);

                return (
                  <tr key={rowKey} className={styles.tr}>
                    {selectable && (
                      <td className={styles.td}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowKey)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={styles.td}
                        style={{ textAlign: col.align }}
                      >
                        {col.render
                          ? col.render(item, index)
                          : String(item[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pageSize < sortedData.length && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              {Math.max(1, (currentPage - 1) * pageSize + 1)}–
              {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
              {sortedData.length} results
            </div>
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrentPage = page === currentPage;
                return (
                  <button
                    key={page}
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(page)}
                    style={
                      isCurrentPage
                        ? {
                            background: 'var(--vf-surface-accent)',
                            color: 'var(--vf-text-accent)',
                            fontWeight: 'var(--vf-font-weight-bold)',
                          }
                        : undefined
                    }
                    aria-label={`Go to page ${page}`}
                    aria-current={isCurrentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';

/**
 * StatusBadge: Utility component for rendering status badges with semantic colors
 */
export interface StatusBadgeProps {
  status: 'success' | 'warn' | 'danger' | 'info' | 'neutral';
  label?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDot = true,
}) => {
  const statusLabels: Record<string, string> = {
    success: 'Active',
    warn: 'Pending',
    danger: 'Failed',
    info: 'Connecting',
    neutral: 'Idle',
  };

  const displayLabel = label ?? statusLabels[status];

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {showDot && <span className={styles.badgeDot} />}
      {displayLabel}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';
