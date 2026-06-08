import KpiWidget from './KpiWidget.jsx'
import ComposedChartWidget from './ComposedChartWidget.jsx'
import SeriesChartWidget from './SeriesChartWidget.jsx'
import PieChartWidget from './PieChartWidget.jsx'
import TableWidget from './TableWidget.jsx'

const WIDGET_MAP = {
  'kpi': KpiWidget,
  'composed-chart': ComposedChartWidget,
  'line-chart': SeriesChartWidget,
  'bar-chart': SeriesChartWidget,
  'area-chart': SeriesChartWidget,
  'pie-chart': PieChartWidget,
  'table': TableWidget,
}

export default function WidgetRenderer({ widget, filters }) {
  const Component = WIDGET_MAP[widget.type]

  if (!Component) {
    return (
      <div className="section" style={{ padding: 16, color: 'var(--text-muted)', fontSize: 11 }}>
        Widget desconocido: <code>{widget.type}</code>
      </div>
    )
  }

  // Derivar chartType del tipo de widget (line-chart → line, bar-chart → bar, etc.)
  const chartType = widget.type?.replace('-chart', '')

  return <Component widget={{ ...widget, chartType }} filters={filters} />
}
