import PropTypes from 'prop-types'

const Table = ({ columns, children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="relative border-b border-white/50 bg-white/35 backdrop-blur-sm after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-red-300/80 after:to-transparent">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider',
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/50 bg-white/20">{children}</tbody>
      </table>
    </div>
  )
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node.isRequired,
      align: PropTypes.oneOf(['left', 'center', 'right'])
    })
  ).isRequired,
  children: PropTypes.node
}

export default Table

