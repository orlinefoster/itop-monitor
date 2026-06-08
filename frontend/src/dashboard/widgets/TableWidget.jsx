import { fieldResolver } from '../lib/fieldResolver.js'
import { useWidgetData } from '../lib/useWidgetData.js'

function parseCompute(compute) {
  if (typeof compute === 'function') return compute
  if (typeof compute === 'string') {
    try {
      // Soporta "(row) => { ... }", "row => expr", etc.
      let body = compute.trim()
      body = body.replace(/^(\(?\w+\)?\s*=>\s*)/, '')
      return body.startsWith('{') ? new Function('row', body) : new Function('row', `return ${body}`)
    } catch { return null }
  }
  return null
}

function computeValue(row, col) {
  const fn = parseCompute(col.compute)
  if (fn) return fn(row)
  if (col.field == null) return ''
  return row[col.field] ?? ''
}

export default function TableWidget({ widget, filters }) {
  const { endpoint, field, columns = [], showSummary, summaryLabel, title, style = {} } = widget
  const { data, loading, error } = useWidgetData(endpoint, filters)

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !data) return null

  const rows = field ? fieldResolver(data, field) : data
  if (!Array.isArray(rows)) return null

  return (
    <div className="section" style={{ padding: '16px' }}>
      {title && (
        <div className="section-header">
          <h2 className="section-title" style={{ fontSize: style.titleSize ? `${style.titleSize}px` : undefined }}>
            {title}
          </h2>
          <span className="section-count">
            {rows.length} {rows.length === 1 ? 'agente' : 'agentes'}
          </span>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="section-empty">Sin actividad en el período</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.label}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.agent_id || i}>
                  {columns.map(col => (
                    <td
                      key={col.label}
                      style={{
                        fontWeight: col.primary ? 500 : undefined,
                        color: col.color || undefined,
                      }}
                    >
                      {computeValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Summary row */}
              {showSummary && rows.length > 1 && (
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600 }}>
                  <td>{summaryLabel || 'total'}</td>
                  {columns.slice(1).map(col => {
                    if (col.compute) return <td key={col.label}>—</td>
                    const total = rows.reduce((s, r) => s + (Number(r[col.field]) || 0), 0)
                    return <td key={col.label} style={{ color: col.color || undefined }}>{total}</td>
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
