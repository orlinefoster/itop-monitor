export default function AgentTable({ agents, yourId }) {
  if (!agents || agents.length === 0) {
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>👥 Tickets por agente</h2>
        <p style={styles.empty}>Sin datos de agentes</p>
      </div>
    )
  }

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>👥 Tickets por agente</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Agente</th>
              <th style={styles.th}>Pendientes</th>
              <th style={styles.th}>Hoy</th>
              <th style={styles.th}>Límite</th>
              <th style={styles.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => {
              const isYou = a.agent_id === yourId
              return (
                <tr
                  key={a.agent_id}
                  style={{
                    ...styles.tr,
                    backgroundColor: isYou ? '#1c2333' : 'transparent',
                  }}
                >
                  <td style={styles.td}>
                    {isYou && <span style={styles.youBadge}>TÚ</span>}
                    {a.agent_name}
                  </td>
                  <td style={styles.td}>{a.pending}</td>
                  <td style={styles.td}>{a.resolved_today}</td>
                  <td style={styles.td}>{a.wip_limit}</td>
                  <td style={styles.td}>
                    {a.wip_ok ? (
                      <span style={styles.badgeGreen}>✅ Bien</span>
                    ) : (
                      <span style={styles.badgeRed}>🔴 Cuello</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  section: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 10,
    padding: '20px',
    marginBottom: 24,
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  empty: {
    color: '#8b949e',
    textAlign: 'center',
    padding: 20,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #30363d',
    color: '#8b949e',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #21262d',
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle',
  },
  youBadge: {
    backgroundColor: '#1f6feb',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    marginRight: 8,
  },
  badgeGreen: {
    color: '#3fb950',
    fontWeight: 600,
  },
  badgeRed: {
    color: '#f85149',
    fontWeight: 600,
  },
}
