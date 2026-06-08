import { useState, useEffect } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchFlow } from '../api.js'

export default function FlowChart({ filters }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!filters) return
    setLoading(true)
    fetchFlow(
      filters.date_from, filters.date_to,
      filters.org_id, filters.team_id, filters.agent_id,
    )
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!data || !data.days || data.days.length === 0) return null

  const chartData = data.days.map(d => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }))

  return (
    <div className="section flow-chart-section">
      <div className="section-header">
        <h2 className="section-title">flujo diario</h2>
        <span className="section-count">
          {data.starting_pending > 0
            ? `${data.starting_pending} pendientes al inicio`
            : `${data.days[data.days.length - 1]?.pending ?? 0} pendientes`
          }
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontSize: '11px',
            }}
            labelFormatter={l => `📅 ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }}
          />
          <Bar
            dataKey="pending"
            name="pendientes"
            fill="rgba(210, 153, 34, 0.25)"
            stroke="rgba(210, 153, 34, 0.5)"
            radius={[2, 2, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="new"
            name="nuevos"
            stroke="#58a6ff"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="resueltos"
            stroke="#3fb950"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
