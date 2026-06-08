import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DEFAULT_DASHBOARD, DEFAULT_VERSION } from './defaults/defaultDashboard.js'
import { loadConfig, saveConfig, clearConfig } from './persistence/storage.js'

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [config, setConfig] = useState(() => loadConfig() || DEFAULT_DASHBOARD)
  const [activeDashboardId, setActiveDashboardId] = useState(
    () => config.dashboards?.[0]?.id || 'resumen'
  )

  // Persistir cada cambio
  useEffect(() => {
    saveConfig(config)
  }, [config])

  const activeDashboard = config.dashboards.find(d => d.id === activeDashboardId) || config.dashboards[0]

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_DASHBOARD)
    setActiveDashboardId(DEFAULT_DASHBOARD.dashboards[0].id)
  }, [])

  const exportJson = useCallback(() => {
    return config
  }, [config])

  const importJson = useCallback((newConfig) => {
    if (!newConfig.version) newConfig.version = DEFAULT_VERSION
    setConfig(newConfig)
    setActiveDashboardId(newConfig.dashboards?.[0]?.id || 'resumen')
  }, [])

  const updateDashboard = useCallback((dashboardId, updates) => {
    setConfig(prev => ({
      ...prev,
      dashboards: prev.dashboards.map(d =>
        d.id === dashboardId ? { ...d, ...updates } : d
      ),
    }))
  }, [])

  const addDashboard = useCallback((dashboard) => {
    setConfig(prev => ({
      ...prev,
      dashboards: [...prev.dashboards, dashboard],
    }))
  }, [])

  const removeDashboard = useCallback((dashboardId) => {
    setConfig(prev => {
      const filtered = prev.dashboards.filter(d => d.id !== dashboardId)
      if (filtered.length === 0) return prev
      if (activeDashboardId === dashboardId) {
        setActiveDashboardId(filtered[0].id)
      }
      return { ...prev, dashboards: filtered }
    })
  }, [activeDashboardId])

  const addWidget = useCallback((dashboardId, widget) => {
    updateDashboard(dashboardId, {
      widgets: [...(config.dashboards.find(d => d.id === dashboardId)?.widgets || []), widget],
    })
  }, [config, updateDashboard])

  const updateWidget = useCallback((dashboardId, widgetId, updates) => {
    setConfig(prev => ({
      ...prev,
      dashboards: prev.dashboards.map(d =>
        d.id === dashboardId
          ? {
              ...d,
              widgets: d.widgets.map(w =>
                w.id === widgetId ? { ...w, ...updates } : w
              ),
            }
          : d
      ),
    }))
  }, [])

  const removeWidget = useCallback((dashboardId, widgetId) => {
    setConfig(prev => ({
      ...prev,
      dashboards: prev.dashboards.map(d =>
        d.id === dashboardId
          ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) }
          : d
      ),
    }))
  }, [])

  const moveWidget = useCallback((dashboardId, widgetId, direction) => {
    setConfig(prev => {
      const dashboard = prev.dashboards.find(d => d.id === dashboardId)
      if (!dashboard) return prev
      const idx = dashboard.widgets.findIndex(w => w.id === widgetId)
      if (idx === -1) return prev
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= dashboard.widgets.length) return prev
      const newWidgets = [...dashboard.widgets];
      [newWidgets[idx], newWidgets[newIdx]] = [newWidgets[newIdx], newWidgets[idx]]
      return {
        ...prev,
        dashboards: prev.dashboards.map(d =>
          d.id === dashboardId ? { ...d, widgets: newWidgets } : d
        ),
      }
    })
  }, [])

  const value = {
    config,
    activeDashboard,
    activeDashboardId,
    setActiveDashboardId,
    resetToDefaults,
    exportJson,
    importJson,
    updateDashboard,
    addDashboard,
    removeDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    moveWidget,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard debe usarse dentro de DashboardProvider')
  return ctx
}
