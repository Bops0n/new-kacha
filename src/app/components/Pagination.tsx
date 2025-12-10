'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItemsCount: number; // จำนวนรายการทั้งหมด (หลัง filter)
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItemsCount,
  itemsPerPage,
}) => {
  if (totalPages <= 1) {
    return null; // ไม่ต้องแสดง Pagination ถ้ามีแค่หน้าเดียวหรือไม่มีเลย
  }

  const maxVisiblePages = 5; // จำนวนปุ่มเลขหน้าที่ต้องการให้แสดงผลสูงสุด
  let startPage: number = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage: number = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages: (number | string)[] = [];

  // Logic for adding '...'
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItemsCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-base-100 rounded-b-lg shadow-sm mt-4">
      <div className="text-sm text-base-content/70">
        แสดงรายการที่ {startItem} ถึง {endItem} จากทั้งหมด {totalItemsCount} รายการ
      </div>

      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          «
        </button>

        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              className={`join-item btn btn-sm ${page === currentPage ? 'btn-active btn-primary' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ) : (
            <button key={index} className="join-item btn btn-sm btn-disabled">
              ...
            </button>
          )
        )}

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
    </div>
  );
};

export default Pagination;