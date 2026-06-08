import KpiWidget from './KpiWidget.jsx'
import ComposedChartWidget from './ComposedChartWidget.jsx'
import TableWidget from './TableWidget.jsx'

const WIDGET_MAP = {
  'kpi': KpiWidget,
  'composed-chart': ComposedChartWidget,
  'table': TableWidget,
}

export default function WidgetRenderer({ widget, filters }) {
  const Component = WIDGET_MAP[widget.type]

  if (!Component) {
    console.warn(`Tipo de widget desconocido: "${widget.type}"`)
    return (
      <div className="section" style={{ padding: 16, color: 'var(--text-muted)', fontSize: 11 }}>
        Widget desconocido: <code>{widget.type}</code>
      </div>
    )
  }

  return <Component widget={widget} filters={filters} />
}
