import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from './api.js'
import StatsCards from './components/StatsCards.jsx'
import AgentTable from './components/AgentTable.jsx'
import MyTickets from './components/MyTickets.jsx'
import BottleneckAlert from './components/BottleneckAlert.jsx'

const POLL_INTERVAL = 30_000 // 30s

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const load = useCallback(async () => {
    try {
      const d = await fetchDashboard()
      setData(d)
      setError(null)
      setLastFetch(new Date().toLocaleTimeString())
    } catch (e) {
      setError(e.message)
    }
  }, [])

  // Initial load + automatic polling
  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [load])

  return (
    <div style={{ ...styles.wrapper }}>
      <header style={styles.header}>
        <h1 style={styles.title}>📊 iTOP Monitor</h1>
        <div style={styles.headerRight}>
          {lastFetch && (
            <span style={styles.lastUpdate}>
              Última actualización: {lastFetch}
            </span>
          )}
          <button onClick={load} style={styles.refreshBtn}>
            ⟳ Refrescar
          </button>
        </div>
      </header>

      {error && (
        <div style={styles.errorBanner}>
          ❌ Error: {error}
          <button onClick={load} style={styles.retryBtn}>Reintentar</button>
        </div>
      )}

      {!data && !error && (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Cargando datos desde iTOP...</p>
        </div>
      )}

      {data && data.error && (
        <div style={styles.loading}>
          <p>⏳ {data.error}</p>
        </div>
      )}

      {data && !data.error && (
        <>
          <BottleneckAlert
            agents={data.team_stats?.bottleneck_agents ?? []}
            wipMax={data.my_summary?.wip_limit ?? 6}
          />
          <StatsCards
            mySummary={data.my_summary}
            teamStats={data.team_stats}
          />
          <AgentTable
            agents={data.team_stats?.agents ?? []}
            yourId={data.my_summary?.agent_id}
          />
          <MyTickets tickets={data.my_tickets ?? []} />
        </>
      )}
    </div>
  )
}

// ── Inline styles (zero deps, clean enough for a monitor) ──

const styles = {
  wrapper: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f1117',
    color: '#e1e4e8',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 700,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  lastUpdate: {
    fontSize: '0.85rem',
    color: '#8b949e',
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#238636',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  errorBanner: {
    backgroundColor: '#da3633',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: '#fff',
    color: '#da3633',
    border: 'none',
    borderRadius: 4,
    padding: '4px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#8b949e',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #30363d',
    borderTop: '4px solid #58a6ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
}
