/**
 * Editor interactivo de arrays (series, barras, líneas, colores).
 * Reemplaza la edición manual de JSON.
 */
export default function SeriesEditor({ value = [], onChange, fields, itemLabel = 'item' }) {
  const items = Array.isArray(value) ? value : []

  const handleItemChange = (index, key, val) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: val } : item
    )
    onChange(updated)
  }

  const handleAdd = () => {
    const defaults = {}
    for (const f of fields) {
      defaults[f.key] = f.defaultValue ?? (f.type === 'color' ? '#58a6ff' : '')
    }
    onChange([...items, defaults])
  }

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  if (items.length === 0) {
    return (
      <div className="series-editor-empty">
        <span className="series-editor-empty-text">sin elementos</span>
        <button type="button" className="series-add-btn" onClick={handleAdd}>
          ➕ agregar
        </button>
      </div>
    )
  }

  return (
    <div className="series-editor">
      {items.map((item, i) => (
        <div key={i} className="series-row">
          <span className="series-index">{i + 1}</span>
          <div className="series-fields">
            {fields.map(f => (
              <div key={f.key} className="series-field">
                {f.type === 'color' ? (
                  <div className="series-color-group">
                    <input
                      type="color"
                      className="series-color"
                      value={item[f.key] || '#58a6ff'}
                      onChange={e => handleItemChange(i, f.key, e.target.value)}
                    />
                    <input
                      type="text"
                      className="series-input series-input-sm"
                      value={item[f.key] || ''}
                      onChange={e => handleItemChange(i, f.key, e.target.value)}
                      placeholder={f.placeholder || f.key}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="series-input"
                    value={item[f.key] ?? ''}
                    onChange={e => handleItemChange(i, f.key, e.target.value)}
                    placeholder={f.placeholder || f.key}
                    title={f.label || f.key}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="series-remove-btn"
            onClick={() => handleRemove(i)}
            title="Eliminar"
          >✕</button>
        </div>
      ))}
      <button type="button" className="series-add-btn" onClick={handleAdd}>
        ➕ agregar {itemLabel}
      </button>
    </div>
  )
}
