import PropTypes from 'prop-types'

const TablePagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel,
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages)
  const size = Math.max(1, Number(pageSize) || 10)
  const total = Math.max(0, Number(totalItems) || 0)

  const start = total === 0 ? 0 : (safeCurrent - 1) * size + 1
  const end = total === 0 ? 0 : Math.min(total, safeCurrent * size)

  return (
    <div className="table-pagination">
      <span className="table-pagination-meta">
        Showing {start}-{end} of {total} {itemLabel}
      </span>
      <div className="table-pagination-controls">
        <button
          type="button"
          className="table-page-btn"
          onClick={() => onPageChange(Math.max(1, safeCurrent - 1))}
          disabled={safeCurrent <= 1}
        >
          Previous
        </button>
        <span className="table-page-indicator">Page {safeCurrent} of {safeTotalPages}</span>
        <button
          type="button"
          className="table-page-btn"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrent + 1))}
          disabled={safeCurrent >= safeTotalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}

TablePagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemLabel: PropTypes.string,
}

TablePagination.defaultProps = {
  itemLabel: 'items',
}

export default TablePagination
