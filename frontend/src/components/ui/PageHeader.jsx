import PropTypes from 'prop-types'

const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node
}

export default PageHeader

