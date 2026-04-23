import PropTypes from 'prop-types'
import Card from './Card'

const StatCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-red-600 p-2.5 text-white shadow-sm">
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

