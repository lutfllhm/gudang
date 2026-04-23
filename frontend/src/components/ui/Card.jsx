import PropTypes from 'prop-types'

const Card = ({ className = '', children }) => {
  return (
    <div
      className={[
        'glass-panel glass-hover rounded-2xl',
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

