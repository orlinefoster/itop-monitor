import StatsCards from './StatsCards.jsx'
import BottleneckAlert from './BottleneckAlert.jsx'
import MyTickets from './MyTickets.jsx'

export default function TicketsView({ data }) {
  if (!data) return null

  return (
    <>
      <BottleneckAlert
        agents={data.team_stats?.bottleneck_agents ?? []}
        wipMax={data.my_summary?.wip_limit ?? 6}
      />
      <StatsCards
        mySummary={data.my_summary}
        teamStats={data.team_stats}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <MyTickets tickets={data.my_tickets ?? []} />
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">tickets del equipo</h2>
            <span className="section-count">{data.team_tickets?.length ?? 0} activos</span>
          </div>
          <p className="section-empty">Vista detallada próximamente</p>
        </div>
      </div>
    </>
  )
}
