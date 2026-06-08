import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from './api.js'
import FilterBar from './components/FilterBar.jsx'
import WeeklyDashboard from './components/WeeklyDashboard.jsx'
import TicketsView from './components/TicketsView.jsx'
import AgentsView from './components/AgentsView.jsx'

const POLL_INTERVAL = 30_000
const TABS = [
  { key: 'dashboard', label: 'resumen' },
  { key: 'tickets',   label: 'tickets' },
  { key: 'agentes',   label: 'agentes' },
]

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filters, setFilters] = useState(null)

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
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-accent">iTOP</span> Monitor
        </h1>
        <div className="header-right">
          {lastFetch && (
            <span className="last-update">última act. {lastFetch}</span>
          )}
          <button onClick={load} className="refresh-btn">⟳ refrescar</button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <span>✕ {error}</span>
          <button onClick={load} className="retry-btn">reintentar</button>
        </div>
      )}

      {/* Loading */}
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
          {/* Tabs */}
          <nav className="tab-bar">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Filter bar — visible on dashboard tab */}
          {activeTab === 'dashboard' && (
            <FilterBar onChange={setFilters} />
          )}

          {/* Tab content */}
          {activeTab === 'dashboard' && (
            <WeeklyDashboard filters={filters} />
          )}
          {activeTab === 'tickets' && (
            <TicketsView data={data} />
          )}
          {activeTab === 'agentes' && (
            <AgentsView data={data} />
          )}
        </>
      )}
    </div>
  )
}
