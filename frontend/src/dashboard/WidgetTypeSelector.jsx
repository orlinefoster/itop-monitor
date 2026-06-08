const WIDGET_TYPES = [
  {
    type: 'kpi',
    name: 'KPI',
    description: 'Número grande con label, color y subtítulo. Ideal para métricas principales.',
    icon: '123',
  },
  {
    type: 'composed-chart',
    name: 'Gráfico mixto',
    description: 'Barras apiladas + líneas. Flujo diario, comparativas, evoluciones.',
    icon: '📊',
  },
  {
    type: 'table',
    name: 'Tabla',
    description: 'Datos en filas y columnas, con totales automáticos. Ideal para rankings.',
    icon: '⊞',
  },
]

export default function WidgetTypeSelector({ onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-gallery" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">agregar widget</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gallery-grid">
          {WIDGET_TYPES.map(t => (
            <button
              key={t.type}
              className="gallery-card"
              onClick={() => onSelect(t.type)}
            >
              <span className="gallery-icon">{t.icon}</span>
              <span className="gallery-name">{t.name}</span>
              <span className="gallery-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
