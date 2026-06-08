export default function StatsCards({ mySummary, teamStats }) {
  if (!mySummary || !teamStats) return null

  const cards = [
    {
      label: '📥 Mis tickets',
      value: mySummary.pending,
      sub: `${mySummary.resolved_today} resueltos hoy`,
      color: mySummary.pending > mySummary.wip_limit ? '#da3633' : '#238636',
    },
    {
      label: '📋 Equipo',
      value: teamStats.total_pending,
      sub: `prom. ${teamStats.avg_per_agent} x agente`,
      color: '#58a6ff',
    },
    {
      label: '⏳ Cuello de botella',
      value: teamStats.bottleneck_agents?.length ?? 0,
      sub: teamStats.bottleneck_agents?.length
        ? teamStats.bottleneck_agents.join(', ')
        : 'Nadie sobrecargado',
      color: teamStats.bottleneck_agents?.length ? '#d29922' : '#238636',
    },
    {
      label: '🏆 Meta WIP',
      value: `≤ ${mySummary.wip_limit}`,
      sub: mySummary.wip_ok ? '✅ En verde' : '🔴 Excedido',
      color: mySummary.wip_ok ? '#238636' : '#da3633',
    },
  ]

  return (
    <div style={styles.grid}>
      {cards.map((c, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.label}>{c.label}</div>
          <div style={{ ...styles.value, color: c.color }}>{c.value}</div>
          <div style={styles.sub}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 10,
    padding: '20px 18px',
  },
  label: {
    fontSize: '0.85rem',
    color: '#8b949e',
    marginBottom: 6,
  },
  value: {
    fontSize: '2.2rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  sub: {
    fontSize: '0.8rem',
    color: '#8b949e',
    marginTop: 6,
  },
}
