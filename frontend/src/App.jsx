import { useState, useEffect, useCallback } from 'react'
import { fetchDashboard } from './api.js'
import { DashboardProvider, useDashboard } from './dashboard/DashboardContext.jsx'
import DashboardBuilder from './dashboard/DashboardBuilder.jsx'
import FilterBar from './components/FilterBar.jsx'
import TicketsView from './components/TicketsView.jsx'
import AgentsView from './components/AgentsView.jsx'

const POLL_INTERVAL = 30_000

// Tablas del sistema — siempre visibles
const SYSTEM_TABS = [
  { id: 'tickets', label: 'tickets' },
  { id: 'agentes', label: 'agentes' },
]

function AppContent() {
  const { activeDashboard, activeDashboardId, setActiveDashboardId, config,
          updateDashboard, removeDashboard, addDashboard } = useDashboard()
  const [filters, setFilters] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [editing, setEditing] = useState(false)
  const [renamingTab, setRenamingTab] = useState(null)
  const [newTabName, setNewTabName] = useState('')

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

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-title-accent">iTOP</span> Monitor
        </h1>
        <div className="header-right">
          {isDashboardTab && (
            <button
              className={`refresh-btn ${editing ? 'active' : ''}`}
              onClick={() => setEditing(!editing)}
              style={{ marginRight: 8 }}
            >
              {editing ? '◉ editando' : '○ editar'}
            </button>
          )}
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
              <div key={t.id} className="tab-wrapper">
                <button
                  className={`tab-btn${activeDashboardId === t.id ? ' active' : ''}`}
                  onClick={() => setActiveDashboardId(t.id)}
                >
                  {renamingTab === t.id ? (
                    <input
                      className="tab-rename-input"
                      value={newTabName}
                      onChange={e => setNewTabName(e.target.value)}
                      onBlur={() => {
                        if (newTabName.trim()) {
                          updateDashboard(t.id, { name: newTabName.trim() })
                        }
                        setRenamingTab(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (newTabName.trim()) {
                            updateDashboard(t.id, { name: newTabName.trim() })
                          }
                          setRenamingTab(null)
                        }
                        if (e.key === 'Escape') setRenamingTab(null)
                      }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    t.label
                  )}
                </button>
                {editing && t.isDashboard && (
                  <>
                    <button
                      className="tab-ctrl-btn"
                      title="Renombrar"
                      onClick={() => { setRenamingTab(t.id); setNewTabName(t.label) }}
                    >✎</button>
                    <button
                      className="tab-ctrl-btn tab-ctrl-del"
                      title="Eliminar solapa"
                      onClick={() => {
                        if (config.dashboards.length > 1) {
                          removeDashboard(t.id)
                        }
                      }}
                      disabled={config.dashboards.length <= 1}
                    >✕</button>
                  </>
                )}
              </div>
            ))}
            {editing && (
              <button
                className="tab-btn tab-add-btn"
                onClick={() => {
                  const id = `tab-${Date.now()}`
                  addDashboard({ id, name: 'nueva solapa', filters: {}, widgets: [] })
                  setActiveDashboardId(id)
                }}
              >➕</button>
            )}
          </nav>

          {/* Dashboard tabs — widgets grid */}
          {isDashboardTab && activeDashboard && (
            <>
              <FilterBar onChange={setFilters} />
              <DashboardBuilder
                activeDashboard={activeDashboard}
                filters={filters}
                editing={editing}
              />
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
