import PropTypes from 'prop-types'

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <div className="max-w-sm text-center">
        {Icon ? (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </div>
  )
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string
}

export default EmptyState

