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
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700/35 focus-visible:ring-offset-2'

  const variants = {
    primary:
      'border border-red-700/10 bg-gradient-to-r from-[#e53935] to-[#c62828] text-white shadow-lg shadow-red-700/20 hover:from-[#d23430] hover:to-[#b72222] hover:shadow-red-800/25 active:translate-y-[0.5px]',
    secondary:
      'border border-slate-200/85 bg-slate-50/85 text-slate-700 shadow-sm shadow-slate-900/5 backdrop-blur-sm hover:bg-slate-100/90 active:translate-y-[0.5px]',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/75',
    danger:
      'border border-red-200/80 bg-red-50 text-red-700 hover:bg-red-100/85 focus-visible:ring-red-700/30'
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

