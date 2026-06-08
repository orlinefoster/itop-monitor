import { fieldResolver } from '../lib/fieldResolver.js'
import { useWidgetData } from '../lib/useWidgetData.js'

export default function KpiWidget({ widget, filters }) {
  const { endpoint, field, style = {}, title } = widget
  const { data, loading, error } = useWidgetData(endpoint, filters)

  const value = !loading && !error && data != null
    ? fieldResolver(data, field)
    : null

  return (
    <div
      className="stat-card"
      style={{
        borderColor: style.borderColor || 'var(--border)',
        background: style.backgroundColor || 'var(--bg-secondary)',
      }}
    >
      <span
        className="stat-label"
        style={{ fontSize: style.titleSize ? `${style.titleSize}px` : undefined }}
      >
        {title}
      </span>
      <span
        className="stat-value"
        style={{ color: style.valueColor || 'var(--text-primary)' }}
      >
        {loading ? '…' : error ? '✕' : value != null ? value : '—'}
      </span>
      {style.subtitle && (
        <span className="stat-sub">{style.subtitle}</span>
      )}
    </div>
  )
}
