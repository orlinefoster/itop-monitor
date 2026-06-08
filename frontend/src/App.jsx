import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from './api.js'
import { DashboardProvider, useDashboard } from './dashboard/DashboardContext.jsx'
import WidgetRenderer from './dashboard/widgets/WidgetRenderer.jsx'
import FilterBar from './components/FilterBar.jsx'
import TicketsView from './components/TicketsView.jsx'
import AgentsView from './components/AgentsView.jsx'

const POLL_INTERVAL = 30_000

// Tablas del sistema — siempre visibles
const SYSTEM_TABS = [
  { id: 'tickets', label: 'tickets' },
  { id: 'agentes', label: 'agentes' },
]

const WIDTH_MAP = {
  full: '1 / -1',
  half: 'span 6',
  third: 'span 4',
  quarter: 'span 3',
}

function AppContent() {
  const { activeDashboard, activeDashboardId, setActiveDashboardId, config } = useDashboard()
  const [filters, setFilters] = useState(null)
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

  // Build tab list: dashboards del usuario + tabs del sistema
  const allTabs = [
    ...config.dashboards.map(d => ({ id: d.id, label: d.name, isDashboard: true })),
    ...SYSTEM_TABS.map(t => ({ id: t.id, label: t.label, isDashboard: false })),
  ]

  const isDashboardTab = config.dashboards.some(d => d.id === activeDashboardId)
  // activeDashboardId can be any dashboard id from config

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
            {allTabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeDashboardId === t.id ? ' active' : ''}`}
                onClick={() => setActiveDashboardId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Dashboard tabs — widgets grid */}
          {isDashboardTab && activeDashboard && (
            <>
              <FilterBar onChange={setFilters} />
              <div className="dashboard-grid">
                {activeDashboard.widgets.map(w => (
                  <div
                    key={w.id}
                    className="dashboard-grid-item"
                    style={{ gridColumn: WIDTH_MAP[w.width] || 'span 6' }}
                  >
                    <WidgetRenderer widget={w} filters={filters} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* System tabs */}
          {activeDashboardId === 'tickets' && <TicketsView data={data} />}
          {activeDashboardId === 'agentes' && <AgentsView data={data} />}
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  )
}
