/**
 * Presets — plantillas de widgets listas para agregar con un click.
 * Cada preset puede agregar uno o varios widgets a la vez.
 */

let _id = Date.now()
function wId() { return `pw-${_id++}` }

export const PRESETS = [
  {
    id: 'flow-mixed',
    name: 'Flujo semanal',
    description: 'Barras apiladas por grupo + líneas de nuevos y resueltos. El mismo gráfico que armamos al principio.',
    icon: '📊',
    widgets: [
      {
        id: wId(),
        type: 'composed-chart',
        title: 'flujo semanal',
        width: 'full',
        height: 300,
        endpoint: '/api/flow',
        field: 'days',
        chart: {
          bars: [{ field: 'pending_by_team', stacked: true, colors: ['#58a6ff','#d29922','#3fb950','#bc8cff','#f0883e'] }],
          lines: [
            { field: 'new', name: 'nuevos', color: '#58a6ff', width: 2 },
            { field: 'resolved', name: 'resueltos', color: '#3fb950', width: 2 },
          ],
          xAxis: 'date',
          showLegend: true,
          showGrid: true,
          tooltip: true,
        },
        style: { titleSize: 11 },
      },
    ],
  },
  {
    id: 'kpi-summary',
    name: 'Resumen de tickets',
    description: '4 tarjetas KPI: nuevos, abiertos, resueltos y activos en el período.',
    icon: '123',
    widgets: [
      {
        id: wId(), type: 'kpi', title: 'nuevos', width: 'quarter',
        endpoint: '/api/weekly', field: 'new_tickets',
        style: { titleSize: 11, valueColor: '#58a6ff', subtitle: 'creados en el período' },
      },
      {
        id: wId(), type: 'kpi', title: 'abiertos', width: 'quarter',
        endpoint: '/api/weekly', field: 'open_tickets',
        style: { titleSize: 11, valueColor: '#d29922', subtitle: 'sin resolver' },
      },
      {
        id: wId(), type: 'kpi', title: 'resueltos', width: 'quarter',
        endpoint: '/api/weekly', field: 'resolved_tickets',
        style: { titleSize: 11, valueColor: '#3fb950', subtitle: 'en el período' },
      },
      {
        id: wId(), type: 'kpi', title: 'activos', width: 'quarter',
        endpoint: '/api/weekly', field: 'total_active',
        style: { titleSize: 11, valueColor: '#e6edf3', subtitle: 'total en curso' },
      },
    ],
  },
  {
    id: 'agent-table',
    name: 'Rendimiento por agente',
    description: 'Tabla con asignados, resueltos y eficiencia de cada agente.',
    icon: '⊞',
    widgets: [
      {
        id: wId(),
        type: 'table',
        title: 'rendimiento por agente',
        width: 'full',
        endpoint: '/api/weekly',
        field: 'agents',
        columns: [
          { label: 'agente', field: 'agent_name', primary: true },
          { label: 'asignados', field: 'new_assigned' },
          { label: 'resueltos', field: 'resolved', color: '#3fb950' },
          { label: 'activos', field: 'total_active' },
          { label: 'eficiencia', field: null, compute: "(row) => { const t = (row.new_assigned||0)+(row.resolved||0); return t>0 ? Math.round((row.resolved/t)*100)+'%' : '0%' }" },
        ],
        showSummary: true,
        summaryLabel: 'total',
        style: { titleSize: 11 },
      },
    ],
  },
  {
    id: 'pie-groups',
    name: 'Distribución por grupo',
    description: 'Torta/dona con la cantidad de pendientes por grupo de soporte.',
    icon: '🥧',
    widgets: [
      {
        id: wId(),
        type: 'pie-chart',
        title: 'pendientes por grupo',
        width: 'half',
        height: 300,
        endpoint: '/api/flow',
        field: 'days[last].pending_by_team',
        chart: {
          donut: true,
          colors: ['#58a6ff','#d29922','#3fb950','#bc8cff','#f0883e','#79c0ff'],
        },
        style: { titleSize: 11 },
      },
    ],
  },
  {
    id: 'line-trend',
    name: 'Evolución diaria',
    description: 'Líneas de nuevos y resueltos día por día para ver la tendencia.',
    icon: '📈',
    widgets: [
      {
        id: wId(),
        type: 'line-chart',
        title: 'evolución diaria',
        width: 'full',
        height: 280,
        endpoint: '/api/flow',
        field: 'days',
        chart: {
          series: [
            { field: 'new', name: 'nuevos', color: '#58a6ff' },
            { field: 'resolved', name: 'resueltos', color: '#3fb950' },
          ],
          xAxis: 'date',
          showLegend: true,
          showGrid: true,
        },
        style: { titleSize: 11 },
      },
    ],
  },
  {
    id: 'bar-backlog',
    name: 'Backlog por grupo',
    description: 'Barras comparativas del volumen actual de pendientes por equipo.',
    icon: '📊',
    widgets: [
      {
        id: wId(),
        type: 'bar-chart',
        title: 'backlog por grupo',
        width: 'half',
        height: 280,
        endpoint: '/api/flow',
        field: 'days[last].pending_by_team',
        chart: {
          series: [{ field: 'value', name: 'pendientes', color: '#d29922' }],
          xAxis: 'name',
          showGrid: true,
        },
        style: { titleSize: 11 },
      },
    ],
  },
]
