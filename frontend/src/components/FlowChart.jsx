import { useState, useEffect } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchFlow } from '../api.js'

const TEAM_COLORS = [
  'rgba(88, 166, 255, 0.65)',   // blue
  'rgba(210, 153, 34, 0.65)',   // amber
  'rgba(63, 185, 80, 0.65)',    // green
  'rgba(188, 140, 255, 0.65)',  // purple
  'rgba(240, 136, 62, 0.65)',   // orange
  'rgba(121, 192, 255, 0.65)',  // light blue
  'rgba(255, 123, 114, 0.65)',  // red
  'rgba(165, 216, 255, 0.65)',  // lighter blue
  'rgba(139, 148, 158, 0.65)',  // gray
  'rgba(86, 186, 159, 0.65)',   // teal
  'rgba(210, 153, 34, 0.35)',   // amber light
  'rgba(88, 166, 255, 0.35)',   // blue light
]

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

  const teamIds = Object.keys(data.teams || {})
  const hasTeams = teamIds.length > 0

  // Transform data for recharts — each team becomes a separate dataKey
  const chartData = data.days.map(d => {
    const entry = {
      date: d.date.slice(5), // MM-DD
      new: d.new,
      resolved: d.resolved,
    }
    if (hasTeams) {
      for (const tid of teamIds) {
        entry[`team_${tid}`] = d.pending_by_team?.[tid] ?? 0
      }
    }
    return entry
  })

  const lastDay = chartData[chartData.length - 1]

  return (
    <div className="section flow-chart-section">
      <div className="section-header">
        <h2 className="section-title">flujo diario</h2>
        <span className="section-count">
          {hasTeams
            ? `${teamIds.length} grupos · ${lastDay?.pending ?? 0} pendientes`
            : `${data.starting_pending > 0 ? data.starting_pending : lastDay?.pending ?? 0} pendientes`
          }
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
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

          {/* Stacked bars: one per team */}
          {hasTeams
            ? teamIds.map((tid, i) => (
                <Bar
                  key={tid}
                  dataKey={`team_${tid}`}
                  name={data.teams[tid] || tid}
                  stackId="pending"
                  fill={TEAM_COLORS[i % TEAM_COLORS.length]}
                  stroke={TEAM_COLORS[i % TEAM_COLORS.length].replace('0.65', '0.9').replace('0.35', '0.8')}
                  radius={i === teamIds.length - 1 ? [2, 2, 0, 0] : 0}
                />
              ))
            : (
              <Bar
                dataKey="pending"
                name="pendientes"
                fill="rgba(210, 153, 34, 0.25)"
                stroke="rgba(210, 153, 34, 0.5)"
                radius={[2, 2, 0, 0]}
              />
            )}

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
