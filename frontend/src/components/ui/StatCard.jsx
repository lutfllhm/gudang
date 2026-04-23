import PropTypes from 'prop-types'
import Card from './Card'

const StatCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-red-200/30 blur-2xl animate-ambient-drift" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-[#2b2f36]">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="glass-glow rounded-xl bg-gradient-to-br from-[#e53935] to-[#c62828] p-2.5 text-white shadow-lg shadow-red-700/25 ring-1 ring-inset ring-white/20">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType
}

export default StatCard

