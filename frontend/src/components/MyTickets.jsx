export default function MyTickets({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎫 Mis tickets</h2>
        <p style={styles.empty}>🎉 No tenés tickets pendientes</p>
      </div>
    )
  }

  return (
    <div style={styles.section}>
      <div style={styles.headerRow}>
        <h2 style={styles.sectionTitle}>🎫 Mis tickets</h2>
        <span style={styles.count}>{tickets.length} abiertos</span>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ref</th>
              <th style={styles.th}>Título</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Urgencia</th>
              <th style={styles.th}>Desde</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} style={styles.tr}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{t.ref}</td>
                <td style={styles.td}>{t.title || '(sin título)'}</td>
                <td style={styles.td}>
                  <span style={statusBadge(t.status)}>
                    {t.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={urgencyColor(t.urgency)}>{t.urgency}</span>
                </td>
                <td style={{ ...styles.td, color: '#8b949e', fontSize: '0.85rem' }}>
                  {t.start_date ? formatDate(t.start_date) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDate(d) {
  try {
    // iTOP usually returns "YYYY-MM-DD HH:MM:SS"
    const parts = d.split(' ')
    if (parts.length >= 1) return parts[0]
    return d
  } catch {
    return d
  }
}

function statusBadge(status) {
  const colorMap = {
    new: '#58a6ff',
    assigned: '#d29922',
    resolved: '#3fb950',
    closed: '#8b949e',
    pending: '#bc8cff',
  }
  const bg = colorMap[status?.toLowerCase()] || '#8b949e'
  return {
    backgroundColor: bg + '22',
    color: bg,
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: '0.8rem',
    fontWeight: 600,
  }
}

function urgencyColor(urgency) {
  const map = {
    '1': '#3fb950',   // low
    '2': '#d29922',   // medium
    '3': '#f85149',   // high
    '4': '#da3633',   // urgent
  }
  return { color: map[urgency] || '#8b949e', fontWeight: 600 }
}

const styles = {
  section: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 10,
    padding: '20px',
    marginBottom: 24,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  count: {
    fontSize: '0.85rem',
    color: '#8b949e',
  },
  empty: {
    color: '#8b949e',
    textAlign: 'center',
    padding: 40,
    fontSize: '1.1rem',
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
}
