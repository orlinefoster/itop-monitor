/**
 * Dashboard por defecto — reproduce fielmente el layout actual
 * del tab "resumen" como widgets configurables.
 */
export const DEFAULT_VERSION = 1

export const DEFAULT_DASHBOARD = {
  version: DEFAULT_VERSION,
  dashboards: [
    {
      id: 'resumen',
      name: 'resumen',
      filters: {
        org_id: null,
        team_id: null,
        agent_id: null,
        date_from: null,
        date_to: null,
      },
      widgets: [
        // ── KPI cards ──
        {
          id: 'kpi-nuevos',
          type: 'kpi',
          title: 'nuevos',
          width: 'quarter',
          endpoint: '/api/weekly',
          field: 'new_tickets',
          style: {
            titleSize: 11,
            valueColor: '#58a6ff',
            subtitle: 'creados en el período',
          },
        },
        {
          id: 'kpi-abiertos',
          type: 'kpi',
          title: 'abiertos',
          width: 'quarter',
          endpoint: '/api/weekly',
          field: 'open_tickets',
          style: {
            titleSize: 11,
            valueColor: '#d29922',
            subtitle: 'sin resolver',
          },
        },
        {
          id: 'kpi-resueltos',
          type: 'kpi',
          title: 'resueltos',
          width: 'quarter',
          endpoint: '/api/weekly',
          field: 'resolved_tickets',
          style: {
            titleSize: 11,
            valueColor: '#3fb950',
            subtitle: 'en el período',
          },
        },
        {
          id: 'kpi-activos',
          type: 'kpi',
          title: 'activos',
          width: 'quarter',
          endpoint: '/api/weekly',
          field: 'total_active',
          style: {
            titleSize: 11,
            valueColor: '#e6edf3',
            subtitle: 'total en curso',
          },
        },
        // ── Flow chart ──
        {
          id: 'chart-flujo',
          type: 'composed-chart',
          title: 'flujo diario',
          width: 'full',
          height: 320,
          endpoint: '/api/flow',
          chart: {
            bars: [
              {
                field: 'pending_by_team',
                name: 'pendientes',
                stacked: true,
                colors: [
                  '#58a6ff', '#d29922', '#3fb950', '#bc8cff',
                  '#f0883e', '#79c0ff', '#ff7b72', '#a5d8ff',
                  '#8b949e', '#56ba9f',
                ],
              },
            ],
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
        // ── Agent performance table ──
        {
          id: 'tabla-agentes',
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
            {
              label: 'eficiencia',
              field: null,
              compute: (row) => {
                const total = (row.new_assigned || 0) + (row.resolved || 0)
                return total > 0 ? Math.round((row.resolved / total) * 100) + '%' : '0%'
              },
            },
          ],
          showSummary: true,
          summaryLabel: 'total',
          style: { titleSize: 11 },
        },
      ],
    },
  ],
}
