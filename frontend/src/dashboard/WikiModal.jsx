/**
 * WikiModal — guía rápida de endpoints, fields y sintaxis del dashboard.
 */
const SECTIONS = [
  {
    id: 'endpoints',
    title: 'Endpoints disponibles',
    content: (
      <table className="wiki-table">
        <thead><tr><th>Endpoint</th><th>Qué devuelve</th><th>Filtros</th></tr></thead>
        <tbody>
          <tr><td><code>/api/weekly</code></td><td>Resumen semanal: KPIs + agentes</td><td><code>org_id</code>, <code>team_id</code>, <code>agent_id</code>, <code>date_from</code>, <code>date_to</code></td></tr>
          <tr><td><code>/api/flow</code></td><td>Timeline diario: nuevos, resueltos, pendientes por grupo</td><td><code>org_id</code>, <code>team_id</code>, <code>agent_id</code>, <code>date_from</code>, <code>date_to</code></td></tr>
          <tr><td><code>/api/dashboard</code></td><td>Dashboard principal (mi Panel, activos, vencidos)</td><td><em>(ninguno)</em></td></tr>
          <tr><td><code>/api/filters</code></td><td>Organizaciones, equipos y agentes disponibles</td><td><code>org_id</code>, <code>team_id</code></td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'weekly',
    title: '/api/weekly — campos disponibles',
    content: (
      <>
        <p className="wiki-sub">Usar como <strong>endpoint</strong> de widgets KPI y tabla.</p>
        <table className="wiki-table">
          <thead><tr><th>Field</th><th>Tipo</th><th>Qué muestra</th></tr></thead>
          <tbody>
            <tr><td><code>new_tickets</code></td><td>número</td><td>Creados en el período</td></tr>
            <tr><td><code>open_tickets</code></td><td>número</td><td>Sin resolver</td></tr>
            <tr><td><code>resolved_tickets</code></td><td>número</td><td>Resueltos en el período</td></tr>
            <tr><td><code>total_active</code></td><td>número</td><td>Total activos en curso</td></tr>
            <tr><td><code>agents</code></td><td>array</td><td>Lista de agentes (para tabla)</td></tr>
          </tbody>
        </table>
        <p className="wiki-sub">Campos de <strong>cada agente</strong> (cuando usás <code>field: "agents"</code> en una tabla): <code>agent_name</code>, <code>new_assigned</code>, <code>resolved</code>, <code>total_active</code></p>
      </>
    ),
  },
  {
    id: 'flow',
    title: '/api/flow — campos disponibles',
    content: (
      <>
        <p className="wiki-sub">Usar como <strong>endpoint</strong> de gráficos de flujo, torta y timeline.</p>
        <table className="wiki-table">
          <thead><tr><th>Field</th><th>Tipo</th><th>Qué muestra</th></tr></thead>
          <tbody>
            <tr><td><code>days</code></td><td>array</td><td>Un objeto por día</td></tr>
            <tr><td><code>days[last]</code></td><td>objeto</td><td>El último día del array</td></tr>
            <tr><td><code>days[last].pending_by_team</code></td><td>dict</td><td><code>{`{team_id: cantidad}`}</code> del último día</td></tr>
            <tr><td><code>days[0]</code></td><td>objeto</td><td>El primer día</td></tr>
            <tr><td><code>starting_pending</code></td><td>número</td><td>Pendientes al arrancar el período</td></tr>
            <tr><td><code>teams</code></td><td>dict</td><td><code>{`{team_id: "nombre"}`}</code></td></tr>
          </tbody>
        </table>
        <p className="wiki-sub">Campos de <strong>cada día</strong> (cuando usás <code>field: "days"</code> en un chart): <code>new</code>, <code>resolved</code>, <code>pending</code>, <code>pending_by_team</code></p>
      </>
    ),
  },
  {
    id: 'syntax',
    title: 'Sintaxis de field paths',
    content: (
      <>
        <p className="wiki-sub">El sistema navega la respuesta JSON usando <strong>paths con puntos</strong>.</p>
        <table className="wiki-table">
          <thead><tr><th>Sintaxis</th><th>Significado</th><th>Ejemplo</th></tr></thead>
          <tbody>
            <tr><td><code>campo</code></td><td>Acceso directo</td><td><code>total_active</code> → <code>127</code></td></tr>
            <tr><td><code>objeto.campo</code></td><td>Anidado con punto</td><td><code>team_stats.total_pending</code></td></tr>
            <tr><td><code>array[last]</code></td><td>Último elemento</td><td><code>days[last]</code> → último día</td></tr>
            <tr><td><code>array[last].campo</code></td><td>Campo del último elemento</td><td><code>days[last].pending_by_team</code></td></tr>
            <tr><td><code>array[N]</code></td><td>Elemento por índice</td><td><code>days[0]</code> → primer día</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: 'widgets',
    title: 'Qué endpoint/field usar para cada widget',
    content: (
      <table className="wiki-table">
        <thead><tr><th>Widget</th><th>Endpoint</th><th>Field</th><th>Notas</th></tr></thead>
        <tbody>
          <tr><td>KPI</td><td><code>/api/weekly</code></td><td><code>new_tickets</code>, <code>total_active</code>, etc.</td><td>Un número grande</td></tr>
          <tr><td>Tabla</td><td><code>/api/weekly</code></td><td><code>agents</code></td><td>Columnas: <code>agent_name</code>, <code>new_assigned</code>, <code>resolved</code></td></tr>
          <tr><td>Mixto</td><td><code>/api/flow</code></td><td><code>days</code></td><td>Barras apiladas + líneas. <code>pending_by_team</code> se expande solo</td></tr>
          <tr><td>Líneas / Barras / Área</td><td><code>/api/flow</code></td><td><code>days</code></td><td>Series: <code>new</code>, <code>resolved</code>, <code>pending</code></td></tr>
          <tr><td>Torta</td><td><code>/api/flow</code></td><td><code>days[last].pending_by_team</code></td><td>Convierte dict <code>{`{id: count}`}</code> a porciones</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'columns',
    title: 'Armado de columnas para tabla',
    content: (
      <>
        <p className="wiki-sub">Cada columna acepta estas propiedades:</p>
        <table className="wiki-table">
          <thead><tr><th>Propiedad</th><th>Qué hace</th></tr></thead>
          <tbody>
            <tr><td><code>label</code></td><td>Texto del encabezado</td></tr>
            <tr><td><code>field</code></td><td>Campo del objeto (o <code>null</code> si usás <code>compute</code>)</td></tr>
            <tr><td><code>primary</code></td><td><code>true</code> para mostrarlo en negrita</td></tr>
            <tr><td><code>color</code></td><td>Color del texto (ej: <code>"#3fb950"</code>)</td></tr>
            <tr><td><code>compute</code></td><td>Función como string: <code>"(row) =&gt; Math.round(row.resolved/total*100) + '%'"</code></td></tr>
          </tbody>
        </table>
      </>
    ),
  },
]

export default function WikiModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wiki-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📖 Wiki del Dashboard</h2>
          <span className="wiki-subtitle">Guía rápida de endpoints, campos y sintaxis</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="wiki-body">
          {SECTIONS.map(s => (
            <section key={s.id} className="wiki-section">
              <h3 className="wiki-section-title">{s.title}</h3>
              {s.content}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
