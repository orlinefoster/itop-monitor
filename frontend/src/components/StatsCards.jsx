export default function StatsCards({ mySummary, teamStats }) {
  if (!mySummary || !teamStats) return null

  const cards = [
    {
      label: 'mis tickets',
      value: mySummary.pending,
      sub: `${mySummary.resolved_today} resueltos hoy`,
      color: mySummary.pending > mySummary.wip_limit
        ? 'var(--accent-red)'
        : 'var(--accent-green)',
    },
    {
      label: 'equipo',
      value: teamStats.total_pending,
      sub: `prom. ${teamStats.avg_per_agent} x agente`,
      color: 'var(--accent-blue)',
    },
    {
      label: 'cuello de botella',
      value: teamStats.bottleneck_agents?.length ?? 0,
      sub: teamStats.bottleneck_agents?.length
        ? teamStats.bottleneck_agents.join(', ')
        : 'nadie sobrecargado',
      color: teamStats.bottleneck_agents?.length
        ? 'var(--accent-yellow)'
        : 'var(--accent-green)',
    },
    {
      label: 'límite wip',
      value: `≤ ${mySummary.wip_limit}`,
      sub: mySummary.wip_ok ? 'en verde' : 'excedido',
      color: mySummary.wip_ok
        ? 'var(--accent-green)'
        : 'var(--accent-red)',
    },
  ]

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <div key={i} className="stat-card">
          <span className="stat-label">{c.label}</span>
          <span
            className="stat-value"
            style={{ color: c.color }}
          >
            {c.value}
          </span>
          <span className="stat-sub">{c.sub}</span>
        </div>
      ))}
    </div>
  )
}
