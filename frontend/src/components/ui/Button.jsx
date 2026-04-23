import PropTypes from 'prop-types'

const Button = ({
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100'
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={[base, variants[variant] || variants.primary, className].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  children: PropTypes.node
}

export default Button

