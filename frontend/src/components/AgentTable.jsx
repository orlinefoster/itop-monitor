export default function AgentTable({ agents, yourId }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="section">
        <h2 className="section-title">agentes</h2>
        <p className="section-empty">Sin datos de agentes</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">agentes</h2>
        <span className="section-count">{agents.length} agentes</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>agente</th>
              <th>pendientes</th>
              <th>hoy</th>
              <th>límite</th>
              <th>estado</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => {
              const isYou = a.agent_id === yourId
              return (
                <tr key={a.agent_id} className={isYou ? 'is-you' : ''}>
                  <td>
                    {isYou && <span className="you-badge">tú</span>}
                    {a.agent_name}
                  </td>
                  <td>{a.pending}</td>
                  <td>{a.resolved_today}</td>
                  <td>{a.wip_limit}</td>
                  <td>
                    {a.wip_ok
                      ? <span className="wip-ok">bien</span>
                      : <span className="wip-over">cuello</span>
                    }
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
