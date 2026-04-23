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
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2'

  const variants = {
    primary:
      'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm shadow-red-600/20 hover:from-red-700 hover:to-red-800 hover:shadow-red-600/30 active:translate-y-[0.5px]',
    secondary:
      'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:translate-y-[0.5px]',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-50',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500/30'
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

