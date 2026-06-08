import { useState, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fieldResolver } from '../lib/fieldResolver.js'
import { useWidgetData } from '../lib/useWidgetData.js'

const PIE_COLORS = [
  '#58a6ff', '#d29922', '#3fb950', '#bc8cff',
  '#f0883e', '#79c0ff', '#ff7b72', '#a5d8ff',
  '#8b949e', '#56ba9f',
]

function toPieData(raw, chart) {
  if (!raw) return []

  // pending_by_team es un dict { teamId: count }
  if (chart.dataField?.includes('pending_by_team') || chart.field === 'pending_by_team') {
    if (raw.pending_by_team && typeof raw.pending_by_team === 'object') {
      return Object.entries(raw.pending_by_team)
        .map(([k, v]) => ({
          name: raw.teams?.[k] || k,
          value: v,
        }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value)
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      // Direct dict
      return Object.entries(raw)
        .map(([k, v]) => ({ name: k, value: v }))
        .filter(d => d.value > 0)
    }
  }

  // Array de objetos con name/value
  if (Array.isArray(raw)) {
    const nameKey = chart.nameField || 'name'
    const valueKey = chart.valueField || 'value'
    return raw
      .map(d => ({ name: d[nameKey] ?? '?', value: Number(d[valueKey]) || 0 }))
      .filter(d => d.value > 0)
  }

  // Objeto simple: { key: count }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .map(([k, v]) => ({ name: k, value: Number(v) || 0 }))
      .filter(d => d.value > 0)
  }

  return []
}

export default function PieChartWidget({ widget, filters }) {
  const { endpoint, field, chart = {}, height = 300, title, style = {} } = widget
  const { data, loading, error } = useWidgetData(endpoint, filters)
  const [activeIndex, setActiveIndex] = useState(null)

  const onMouseEnter = useCallback((_, index) => setActiveIndex(index), [])
  const onMouseLeave = useCallback(() => setActiveIndex(null), [])

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !data) return null

  const raw = field ? fieldResolver(data, field) : data
  const pieData = toPieData(raw, chart)
  if (pieData.length === 0) return null

  const isDonut = chart.donut !== false
  const innerR = isDonut ? 60 : 0

  const total = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="widget-chart" style={{ padding: '16px 0' }}>
      {title && (
        <div className="section-header">
          <h2 className="section-title" style={{ fontSize: style.titleSize ? `${style.titleSize}px` : undefined }}>
            {title}
          </h2>
          <span className="section-count">{total} total</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius={120}
            paddingAngle={2}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {pieData.map((_, i) => (
              <Cell
                key={i}
                fill={chart.colors?.[i % chart.colors.length] || PIE_COLORS[i % PIE_COLORS.length]}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} (${Math.round((value / total) * 100)}%)`, name]}
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--text-primary)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
