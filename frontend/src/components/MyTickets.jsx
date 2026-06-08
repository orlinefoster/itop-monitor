export default function MyTickets({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="section">
        <h2 className="section-title">mis tickets</h2>
        <p className="section-empty">No tenés tickets pendientes</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">mis tickets</h2>
        <span className="section-count">{tickets.length} abiertos</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ref</th>
              <th>título</th>
              <th>estado</th>
              <th>urgencia</th>
              <th>desde</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.ref}</td>
                <td>{t.title || '(sin título)'}</td>
                <td>
                  <span className={`status-badge status-${(t.status || '').toLowerCase()}`}>
                    {t.status}
                  </span>
                </td>
                <td>
                  <span className={`urgency-${t.urgency}`}>
                    {urgencyLabel(t.urgency)}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {t.start_date ? formatDate(t.start_date) : '—'}
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
    const parts = d.split(' ')
    return parts[0] || d
  } catch {
    return d
  }
}

function urgencyLabel(u) {
  const map = {
    '1': 'baja',
    '2': 'media',
    '3': 'alta',
    '4': 'urgente',
  }
  return map[u] || u
}
