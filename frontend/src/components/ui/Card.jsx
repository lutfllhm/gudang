import PropTypes from 'prop-types'

const Card = ({ className = '', children }) => {
  return (
    <div
      className={[
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        'supports-[backdrop-filter]:bg-white/90',
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

export default Card

