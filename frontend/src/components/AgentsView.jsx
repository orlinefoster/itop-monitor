import AgentTable from './AgentTable.jsx'

export default function AgentsView({ data }) {
  if (!data) return null

  return (
    <AgentTable
      agents={data.team_stats?.agents ?? []}
      yourId={data.my_summary?.agent_id}
    />
  )
}
