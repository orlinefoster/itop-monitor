import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from './api.js'
import StatsCards from './components/StatsCards.jsx'
import AgentTable from './components/AgentTable.jsx'
import MyTickets from './components/MyTickets.jsx'
import BottleneckAlert from './components/BottleneckAlert.jsx'

const POLL_INTERVAL = 30_000

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

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-accent">iTOP</span> Monitor
        </h1>
        <div className="header-right">
          {lastFetch && (
            <span className="last-update">
              última act. {lastFetch}
            </span>
          )}
          <button onClick={load} className="refresh-btn">
            ⟳ refrescar
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>✕ {error}</span>
          <button onClick={load} className="retry-btn">reintentar</button>
        </div>
      )}

      {!data && !error && (
        <div className="loading-state">
          <div className="spinner" />
          <p className="loading-text">conectando con iTOP…</p>
        </div>
      )}

      {data?.error && (
        <div className="loading-state">
          <p className="loading-text">{data.error}</p>
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
