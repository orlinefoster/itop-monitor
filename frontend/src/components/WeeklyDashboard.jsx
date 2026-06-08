import { useState, useEffect } from 'react'
import { fetchWeekly } from '../api.js'

export default function WeeklyDashboard({ filters }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!filters) return
    setLoading(true)
    fetchWeekly(
      filters.org_id, filters.team_id, filters.agent_id,
      filters.date_from, filters.date_to
    )
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters])

  if (loading) {
    return (
      <div className="loading-state" style={{ padding: '40px 0' }}>
        <div className="spinner" />
        <p className="loading-text">cargando resumen semanal…</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      {/* Week header */}
      <div className="week-header">
        <span className="week-label">semana del</span>
        <span className="week-range">
          {data.week_start} → {data.week_end}
        </span>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">nuevos</span>
          <span className="stat-value" style={{ color: 'var(--accent-blue)' }}>
            {data.new_tickets}
          </span>
          <span className="stat-sub">creados esta semana</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">abiertos</span>
          <span className="stat-value" style={{ color: 'var(--accent-yellow)' }}>
            {data.open_tickets}
          </span>
          <span className="stat-sub">sin resolver</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">resueltos</span>
          <span className="stat-value" style={{ color: 'var(--accent-green)' }}>
            {data.resolved_tickets}
          </span>
          <span className="stat-sub">esta semana</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">activos</span>
          <span className="stat-value" style={{ color: 'var(--text-primary)' }}>
            {data.total_active}
          </span>
          <span className="stat-sub">total en curso</span>
        </div>
      </div>

      {/* Agent performance */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">rendimiento por agente</h2>
          <span className="section-count">{data.agents.length} agentes</span>
        </div>
        {data.agents.length === 0 ? (
          <p className="section-empty">Sin actividad esta semana</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>agente</th>
                  <th>asignados</th>
                  <th>resueltos</th>
                  <th>activos</th>
                  <th>eficiencia</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map(a => {
                  const total = a.new_assigned + a.resolved
                  const eff = total > 0
                    ? Math.round((a.resolved / total) * 100)
                    : 0
                  return (
                    <tr key={a.agent_id}>
                      <td style={{ fontWeight: 500 }}>{a.agent_name}</td>
                      <td>{a.new_assigned}</td>
                      <td style={{ color: 'var(--accent-green)' }}>{a.resolved}</td>
                      <td>{a.total_active}</td>
                      <td>
                        <span className={eff >= 50 ? 'wip-ok' : 'wip-over'}>
                          {eff}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {/* Summary row */}
                {data.agents.length > 1 && (
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600 }}>
                    <td>total</td>
                    <td>{data.agents.reduce((s, a) => s + a.new_assigned, 0)}</td>
                    <td style={{ color: 'var(--accent-green)' }}>
                      {data.agents.reduce((s, a) => s + a.resolved, 0)}
                    </td>
                    <td>{data.agents.reduce((s, a) => s + a.total_active, 0)}</td>
                    <td>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
