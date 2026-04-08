import React, { useId } from "react";

type PaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  selectId?: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS: number[] = [5, 10, 15, 20];

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
  selectId,
}) => {
  const generatedSelectId: string = useId();
  const pageSizeSelectId: string = selectId ?? `pagination-page-size-${generatedSelectId}`;
  const safePageSize: number = pageSize > 0 ? pageSize : pageSizeOptions[0] ?? DEFAULT_PAGE_SIZE_OPTIONS[0];

  const totalPages: number = Math.max(1, Math.ceil(totalCount / safePageSize));
  const startItem: number = totalCount === 0 ? 0 : (page - 1) * safePageSize + 1;
  const endItem: number = Math.min(page * safePageSize, totalCount);

  const clampedPage: number = Math.min(Math.max(page, 1), totalPages);
  const pageNumbers: number[] = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handlePageChange = (nextPage: number): void => {
    const safePage: number = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage !== clampedPage) {
      onPageChange(safePage);
    }
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newSize: number = Number(event.target.value);
    const safeNewSize: number = Number.isFinite(newSize) && newSize > 0 ? newSize : safePageSize;

    onPageSizeChange(safeNewSize);
    onPageChange(1);
  };

  const isPreviousDisabled: boolean = totalCount === 0 || clampedPage <= 1;
  const isNextDisabled: boolean = totalCount === 0 || clampedPage >= totalPages;

  return (
    <div className={className}>
      <div className="row align-items-center mb-3 g-2">
        <div className="col-auto">
          <label htmlFor={pageSizeSelectId} className="col-form-label">
            Results per page
          </label>
        </div>
        <div className="col-auto">
          <select
            id={pageSizeSelectId}
            className="form-select"
            value={safePageSize}
            onChange={handlePageSizeChange}
            aria-label="Results per page"
          >
            {pageSizeOptions.map((option: number) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <span className="text-muted">
            Showing {startItem}-{endItem} of {totalCount} items
          </span>
        </div>
      </div>

      <nav aria-label="Pagination navigation">
        <ul className="pagination mb-0">
          <li className={`page-item${isPreviousDisabled ? " disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => handlePageChange(clampedPage - 1)}
              disabled={isPreviousDisabled}
              aria-label="Previous page"
            >
              Previous
            </button>
          </li>

          {pageNumbers.map((pageNumber: number) => {
            const isActive: boolean = pageNumber === clampedPage;

            return (
              <li key={pageNumber} className={`page-item${isActive ? " active" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isActive}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              </li>
            );
          })}

          <li className={`page-item${isNextDisabled ? " disabled" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => handlePageChange(clampedPage + 1)}
              disabled={isNextDisabled}
              aria-label="Next page"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
