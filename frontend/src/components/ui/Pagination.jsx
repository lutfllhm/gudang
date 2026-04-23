import PropTypes from 'prop-types'
import Button from './Button'

const Pagination = ({ page, limit, total, totalPages, onPageChange, label }) => {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = total === 0 ? 0 : Math.min(page * limit, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
      <div className="text-sm text-slate-600">
        Menampilkan <span className="font-medium text-slate-900">{start}</span> sampai{' '}
        <span className="font-medium text-slate-900">{end}</span> dari{' '}
        <span className="font-medium text-slate-900">{total}</span> {label}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  label: PropTypes.string
}

Pagination.defaultProps = {
  label: 'data'
}

export default Pagination

