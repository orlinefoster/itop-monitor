export default function BottleneckAlert({ agents, wipMax }) {
  if (!agents || agents.length === 0) return null

  return (
    <div style={styles.banner}>
      <div style={styles.icon}>🔴</div>
      <div>
        <strong style={styles.title}>Cuello de botella detectado</strong>
        <p style={styles.text}>
          {agents.length === 1
            ? `${agents[0]} tiene más de ${wipMax} tickets pendientes.`
            : `${agents.join(', ')} tienen más de ${wipMax} tickets pendientes.`}
        </p>
      </div>
    </div>
  )
}

const styles = {
  banner: {
    backgroundColor: '#3d1f1e',
    border: '1px solid #da3633',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: '1.5rem',
  },
  title: {
    color: '#f85149',
    fontSize: '0.95rem',
  },
  text: {
    margin: '4px 0 0',
    color: '#e1e4e8',
    fontSize: '0.85rem',
  },
}
