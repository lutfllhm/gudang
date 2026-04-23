import PropTypes from 'prop-types'

const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="bg-gradient-to-r from-slate-900 via-red-700 to-slate-900 bg-clip-text text-2xl font-semibold text-transparent">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600/90">{description}</p>
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

