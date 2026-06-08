import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fieldResolver } from '../lib/fieldResolver.js'
import { useWidgetData } from '../lib/useWidgetData.js'

export default function ComposedChartWidget({ widget, filters }) {
  const { endpoint, field, chart = {}, height = 300, title, style = {} } = widget
  const { data, loading, error } = useWidgetData(endpoint, filters)

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !data) return null

  // Extraer el array de datos
  const rawData = field ? fieldResolver(data, field) : data
  if (!rawData || !Array.isArray(rawData)) return null
  if (rawData.length === 0) return null

  // Transformar data para recharts
  const xKey = chart.xAxis || 'date'
  const chartData = rawData.map(d => {
    const entry = { ...d }

    // Si xKey es tipo "date" con formato ISO, mostrar solo MM-DD
    if (typeof d[xKey] === 'string' && d[xKey].includes('-') && d[xKey].length === 10) {
      entry._label = d[xKey].slice(5)
    } else {
      entry._label = d[xKey]
    }

    return entry
  })

  // ── Stacked bars: barras dinámicas por equipo ──
  const barConfigs = (chart.bars || []).map((cfg, i) => {
    if (cfg.stacked && cfg.field === 'pending_by_team') {
      // pending_by_team es un dict { teamId: count }
      // Recopilar todos los teamIds del dataset
      const teamIds = new Set()
      for (const d of rawData) {
        const pbt = d[cfg.field]
        if (pbt && typeof pbt === 'object') {
          for (const tid of Object.keys(pbt)) {
            teamIds.add(tid)
          }
        }
      }
      const sortedIds = [...teamIds].sort()
      return sortedIds.map((tid, j) => ({
        dataKey: tid,
        name: (data.teams && data.teams[tid]) || tid,
        stackId: 'pending',
        color: cfg.colors?.[j % cfg.colors.length] || '#d29922',
      }))
    }
    return [{
      dataKey: cfg.field,
      name: cfg.name || cfg.field,
      stackId: cfg.stacked ? 'main' : undefined,
      color: cfg.color || cfg.colors?.[0] || '#d29922',
    }]
  }).flat()

  // ── Líneas ──
  const lineConfigs = (chart.lines || []).map(cfg => ({
    dataKey: cfg.field,
    name: cfg.name || cfg.field,
    color: cfg.color || '#58a6ff',
    width: cfg.width || 2,
  }))

  if (barConfigs.length === 0 && lineConfigs.length === 0) return null

  return (
    <div className="widget-chart" style={{ padding: '16px 0' }}>
      {title && (
        <div className="section-header">
          <h2 className="section-title" style={{ fontSize: style.titleSize ? `${style.titleSize}px` : undefined }}>
            {title}
          </h2>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          {chart.showGrid !== false && (
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          )}
          <XAxis
            dataKey="_label"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          {chart.tooltip !== false && (
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'var(--text-primary)',
              }}
            />
          )}
          {chart.showLegend && (
            <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }} />
          )}

          {/* Barras */}
          {barConfigs.map(cfg => (
            <Bar
              key={`bar-${cfg.dataKey}`}
              dataKey={cfg.dataKey}
              name={cfg.name}
              stackId={cfg.stackId}
              fill={cfg.color}
              stroke={cfg.color.replace('0.65', '0.9').replace('0.35', '0.8')}
              radius={[1, 1, 0, 0]}
            />
          ))}

          {/* Líneas */}
          {lineConfigs.map(cfg => (
            <Line
              key={`line-${cfg.dataKey}`}
              type="monotone"
              dataKey={cfg.dataKey}
              name={cfg.name}
              stroke={cfg.color}
              strokeWidth={cfg.width}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
