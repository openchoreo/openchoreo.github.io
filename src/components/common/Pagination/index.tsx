import React from 'react';
import styles from './styles.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className={styles.pagination}>
      <p className={styles.paginationInfo}>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> {itemLabel}
      </p>
      <div className={styles.paginationControls}>
        <button
          className={styles.pageButton}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={n === page ? `${styles.pageNumber} ${styles.pageNumberActive}` : styles.pageNumber}
          >
            {n}
          </button>
        ))}
        <button
          className={styles.pageButton}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
