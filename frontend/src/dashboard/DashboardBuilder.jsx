import { useState, useRef } from 'react'
import { useDashboard } from './DashboardContext.jsx'
import { exportConfig, importConfig } from './persistence/importExport.js'
import WidgetRenderer from './widgets/WidgetRenderer.jsx'
import WidgetConfigPanel from './WidgetConfigPanel.jsx'
import WidgetTypeSelector from './WidgetTypeSelector.jsx'

const WIDTH_MAP = {
  full: '1 / -1',
  half: 'span 6',
  third: 'span 4',
  quarter: 'span 3',
}

let _widgetCounter = Date.now()
function newId() { return `w-${_widgetCounter++}` }

export default function DashboardBuilder({ activeDashboard, filters, editing }) {
  const {
    addDashboard, removeDashboard, updateDashboard,
    addWidget, removeWidget, updateWidget, moveWidget,
    setActiveDashboardId, exportJson, importJson, resetToDefaults,
  } = useDashboard()

  const [editingWidget, setEditingWidget] = useState(null)
  const [showingGallery, setShowingGallery] = useState(false)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  const handleEditWidget = (widget) => setEditingWidget(widget)
  const handleSaveWidget = (widgetId, updates) => {
    updateWidget(activeDashboard.id, widgetId, updates)
    setEditingWidget(null)
  }

  const handleAddWidget = (type) => {
    setShowingGallery(false)
    const widget = {
      id: `w-${Date.now()}`,
      type,
      title: type.replace('-', ' '),
      width: 'full',
      endpoint: '/api/weekly',
      field: '',
      style: {},
      chart: type === 'composed-chart' ? { bars: [], lines: [], xAxis: 'date', showLegend: true, showGrid: true } : undefined,
      columns: type === 'table' ? [] : undefined,
      showSummary: type === 'table',
    }
    addWidget(activeDashboard.id, widget)
    setEditingWidget(widget)
  }

  const handleExport = () => {
    exportConfig(exportJson())
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const config = await importConfig(file)
      importJson(config)
      setImportError(null)
    } catch (err) {
      setImportError(err.message)
    }
    // Reset input so same file can be re-imported
    e.target.value = ''
  }

  return (
    <>
      {/* ── Builder toolbar ── */}
      {editing && (
        <div className="builder-toolbar">
          <button className="builder-btn" onClick={() => setShowingGallery(true)}>
            ➕ widget
          </button>
          <button
            className="builder-btn"
            onClick={() => {
              const id = `tab-${Date.now()}`
              addDashboard({ id, name: 'nueva solapa', filters: {}, widgets: [] })
              setActiveDashboardId(id)
            }}
          >
            ➕ solapa
          </button>
          <span className="builder-sep" />
          <button className="builder-btn builder-btn-io" onClick={handleExport}>
            ↓ exportar
          </button>
          <button className="builder-btn builder-btn-io" onClick={() => fileInputRef.current?.click()}>
            ↑ importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className="builder-btn builder-btn-danger" onClick={resetToDefaults}>
            ↺ reset
          </button>
          {importError && (
            <span className="builder-error">✕ {importError}</span>
          )}
        </div>
      )}

      {/* ── Widget grid ── */}
      <div className="dashboard-grid">
        {activeDashboard.widgets.map((w, idx) => (
          <div
            key={w.id}
            className={`dashboard-grid-item${editing ? ' widget-editing' : ''}`}
            style={{ gridColumn: WIDTH_MAP[w.width] || 'span 6' }}
          >
            {editing && (
              <div className="widget-controls">
                <button
                  className="widget-ctrl-btn"
                  title="Mover arriba"
                  onClick={() => moveWidget(activeDashboard.id, w.id, -1)}
                  disabled={idx === 0}
                >⬆</button>
                <button
                  className="widget-ctrl-btn"
                  title="Mover abajo"
                  onClick={() => moveWidget(activeDashboard.id, w.id, 1)}
                  disabled={idx === activeDashboard.widgets.length - 1}
                >⬇</button>
                <button className="widget-ctrl-btn" title="Configurar" onClick={() => handleEditWidget(w)}>⚙</button>
                <button className="widget-ctrl-btn widget-ctrl-del" title="Eliminar" onClick={() => removeWidget(activeDashboard.id, w.id)}>✕</button>
              </div>
            )}
            <WidgetRenderer widget={w} filters={filters} />
          </div>
        ))}
      </div>

      {/* ── Config panel (modal) ── */}
      {editingWidget && (
        <WidgetConfigPanel
          widget={editingWidget}
          onSave={handleSaveWidget}
          onClose={() => setEditingWidget(null)}
        />
      )}

      {/* ── Widget type selector (modal) ── */}
      {showingGallery && (
        <WidgetTypeSelector
          onSelect={handleAddWidget}
          onClose={() => setShowingGallery(false)}
        />
      )}
    </>
  )
}
