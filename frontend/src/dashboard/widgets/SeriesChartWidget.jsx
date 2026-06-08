import {
  LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fieldResolver } from '../lib/fieldResolver.js'
import { useWidgetData } from '../lib/useWidgetData.js'

const CHART_MAP = {
  line: { Chart: LineChart, Series: Line, seriesProps: { type: 'monotone', dot: false, strokeWidth: 2 } },
  bar: { Chart: BarChart, Series: Bar, seriesProps: { radius: [2, 2, 0, 0] } },
  area: { Chart: AreaChart, Series: Area, seriesProps: { type: 'monotone', fillOpacity: 0.2, strokeWidth: 2 } },
}

export default function SeriesChartWidget({ widget, filters }) {
  const { endpoint, field, chart = {}, chartType = 'line', height = 300, title, style = {} } = widget
  const { data, loading, error } = useWidgetData(endpoint, filters)

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !data) return null

  const rawData = field ? fieldResolver(data, field) : data
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return null

  const xKey = chart.xAxis || 'date'
  let chartData
  // Si rawData es un dict {key: value}, convertirlo a [{name: key, value: value}]
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    chartData = Object.entries(rawData).map(([k, v]) => {
      const entry = { name: k, _label: k, value: typeof v === 'object' ? v.value || v.count || 0 : Number(v) || 0 }
      if (typeof v === 'object') Object.assign(entry, v)
      return entry
    })
  } else {
    chartData = rawData.map(d => {
      const entry = { ...d }
      if (typeof d[xKey] === 'string' && d[xKey].includes('-') && d[xKey].length === 10) {
        entry._label = d[xKey].slice(5)
      } else {
        entry._label = d[xKey]
      }
      return entry
    })
  }

  const { Chart, Series, seriesProps } = CHART_MAP[chartType] || CHART_MAP.line
  const series = chart.series || []
  const stacked = chart.stacked

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
        <Chart data={chartData}>
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
              }}
            />
          )}
          {chart.showLegend && (
            <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }} />
          )}
          {series.map((s, i) => (
            <Series
              key={s.field || i}
              dataKey={s.field || i}
              name={s.name || s.field || `serie ${i + 1}`}
              fill={s.color || '#58a6ff'}
              stroke={s.color || '#58a6ff'}
              stackId={stacked ? 'main' : undefined}
              {...seriesProps}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}
