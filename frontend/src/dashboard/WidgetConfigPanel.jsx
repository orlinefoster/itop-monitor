import { useState } from 'react'

/**
 * Sets a nested value in an object given a dot-separated path.
 * e.g. setNested({}, 'chart.showLegend', true) → { chart: { showLegend: true } }
 */
function setNested(obj, path, value) {
  const keys = path.split('.')
  let current = { ...obj }
  let ptr = current
  for (let i = 0; i < keys.length - 1; i++) {
    ptr[keys[i]] = { ...(ptr[keys[i]] || {}) }
    ptr = ptr[keys[i]]
  }
  ptr[keys[keys.length - 1]] = value
  return current
}

function getNested(obj, path) {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[key]
  }
  return current
}

const FIELDS_BY_TYPE = {
  'kpi': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo (path)', type: 'text', placeholder: 'ej: new_tickets, team_stats.total_pending' },
    { key: 'style.titleSize', label: 'Tamaño título (px)', type: 'number' },
    { key: 'style.valueColor', label: 'Color del valor', type: 'color' },
    { key: 'style.subtitle', label: 'Subtítulo', type: 'text' },
  ],
  'composed-chart': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'height', label: 'Alto (px)', type: 'number' },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo del array', type: 'text', placeholder: 'dejar vacío si el endpoint devuelve array' },
    { key: 'chart.showLegend', label: 'Mostrar leyenda', type: 'toggle' },
    { key: 'chart.showGrid', label: 'Mostrar grilla', type: 'toggle' },
    { key: 'chart.tooltip', label: 'Tooltip', type: 'toggle' },
  ],
  'line-chart': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'height', label: 'Alto (px)', type: 'number' },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo del array', type: 'text', placeholder: 'dejar vacío si el endpoint devuelve array' },
    { key: 'chart.xAxis', label: 'Campo del eje X', type: 'text' },
    { key: 'chart.stacked', label: 'Apilado', type: 'toggle' },
    { key: 'chart.showLegend', label: 'Mostrar leyenda', type: 'toggle' },
    { key: 'chart.showGrid', label: 'Mostrar grilla', type: 'toggle' },
  ],
  'bar-chart': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'height', label: 'Alto (px)', type: 'number' },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo del array', type: 'text', placeholder: 'dejar vacío si el endpoint devuelve array' },
    { key: 'chart.xAxis', label: 'Campo del eje X', type: 'text' },
    { key: 'chart.stacked', label: 'Apilado', type: 'toggle' },
    { key: 'chart.showLegend', label: 'Mostrar leyenda', type: 'toggle' },
    { key: 'chart.showGrid', label: 'Mostrar grilla', type: 'toggle' },
  ],
  'area-chart': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'height', label: 'Alto (px)', type: 'number' },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo del array', type: 'text', placeholder: 'dejar vacío si el endpoint devuelve array' },
    { key: 'chart.xAxis', label: 'Campo del eje X', type: 'text' },
    { key: 'chart.stacked', label: 'Apilado', type: 'toggle' },
    { key: 'chart.showLegend', label: 'Mostrar leyenda', type: 'toggle' },
    { key: 'chart.showGrid', label: 'Mostrar grilla', type: 'toggle' },
  ],
  'pie-chart': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'height', label: 'Alto (px)', type: 'number' },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo (path)', type: 'text', placeholder: 'ej: days[last].pending_by_team' },
    { key: 'chart.donut', label: 'Modo dona', type: 'toggle' },
    { key: 'chart.nameField', label: 'Campo nombre', type: 'text', placeholder: 'name' },
    { key: 'chart.valueField', label: 'Campo valor', type: 'text', placeholder: 'value' },
  ],
  'table': [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'width', label: 'Ancho', type: 'select', options: ['full', 'half', 'third', 'quarter'] },
    { key: 'endpoint', label: 'Endpoint', type: 'text' },
    { key: 'field', label: 'Campo del array', type: 'text', placeholder: 'ej: agents, days' },
    { key: 'showSummary', label: 'Mostrar totales', type: 'toggle' },
    { key: 'summaryLabel', label: 'Label de totales', type: 'text' },
  ],
}

export default function WidgetConfigPanel({ widget, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    const values = {}
    const fields = FIELDS_BY_TYPE[widget.type] || []
    for (const f of fields) {
      values[f.key] = getNested(widget, f.key) ?? ''
    }
    return values
  })

  const fields = FIELDS_BY_TYPE[widget.type] || []

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const updates = {}
    for (const [key, value] of Object.entries(form)) {
      Object.assign(updates, setNested({}, key, value))
    }
    onSave(widget.id, updates)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">configurar {widget.type.replace('-', ' ')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {fields.map(f => (
            <div key={f.key} className="config-field">
              <label className="config-label">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  className="config-select"
                  value={form[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                >
                  {f.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : f.type === 'toggle' ? (
                <label className="config-toggle">
                  <input
                    type="checkbox"
                    checked={form[f.key] === true || form[f.key] === 'true'}
                    onChange={e => handleChange(f.key, e.target.checked)}
                  />
                  <span className="config-toggle-label">
                    {form[f.key] === true || form[f.key] === 'true' ? 'sí' : 'no'}
                  </span>
                </label>
              ) : f.type === 'color' ? (
                <div className="config-color-row">
                  <input
                    type="color"
                    className="config-color"
                    value={form[f.key] || '#4af0a0'}
                    onChange={e => handleChange(f.key, e.target.value)}
                  />
                  <input
                    type="text"
                    className="config-input config-color-text"
                    value={form[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                    placeholder="#hex"
                  />
                </div>
              ) : (
                <input
                  type={f.type || 'text'}
                  className="config-input"
                  value={form[f.key] ?? ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder || ''}
                />
              )}
            </div>
          ))}
          <div className="modal-actions">
            <button type="submit" className="config-save-btn">guardar</button>
            <button type="button" className="config-cancel-btn" onClick={onClose}>cancelar</button>
          </div>
        </form>
        <div className="modal-footer">
          <span className="config-id">id: {widget.id}</span>
          <span className="config-type">tipo: {widget.type}</span>
        </div>
      </div>
    </div>
  )
}
