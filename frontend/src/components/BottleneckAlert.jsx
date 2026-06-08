export default function BottleneckAlert({ agents, wipMax }) {
  if (!agents || agents.length === 0) return null

  return (
    <div className="bottleneck-banner">
      <span className="bottleneck-icon">⚠</span>
      <div>
        <div className="bottleneck-title">cuello de botella</div>
        <p className="bottleneck-text">
          {agents.length === 1
            ? `${agents[0]} tiene más de ${wipMax} tickets pendientes.`
            : `${agents.join(', ')} tienen más de ${wipMax} tickets pendientes.`}
        </p>
      </div>
    </div>
  )
}
