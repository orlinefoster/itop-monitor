import { useState } from 'react'
import { useDashboard } from './DashboardContext.jsx'
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

export default function DashboardBuilder({ activeDashboard, filters }) {
  const {
    addDashboard, removeDashboard, updateDashboard,
    addWidget, removeWidget, updateWidget, moveWidget,
    setActiveDashboardId,
  } = useDashboard()

  const [editing, setEditing] = useState(false)
  const [editingWidget, setEditingWidget] = useState(null)
  const [showingGallery, setShowingGallery] = useState(false)

  const handleEditWidget = (widget) => setEditingWidget(widget)
  const handleSaveWidget = (widgetId, updates) => {
    updateWidget(activeDashboard.id, widgetId, updates)
    setEditingWidget(null)
  }

  const handleAddWidget = (type) => {
    setShowingGallery(false)
    const widget = {
      id: newId(),
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

  return (
    <>
      {/* ── Builder toolbar ── */}
      <div className="builder-toolbar">
        <button
          className={`builder-toggle ${editing ? 'active' : ''}`}
          onClick={() => setEditing(!editing)}
        >
          {editing ? '◉ editando' : '○ editar'}
        </button>
        {editing && (
          <>
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
          </>
        )}
      </div>

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
