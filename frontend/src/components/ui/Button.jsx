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
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2'

  const variants = {
    primary:
      'border border-white/20 bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-600 hover:shadow-red-500/35 active:translate-y-[0.5px]',
    secondary:
      'border border-white/60 bg-white/50 text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-sm hover:bg-white/70 active:translate-y-[0.5px]',
    ghost: 'bg-transparent text-slate-700 hover:bg-white/40',
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

