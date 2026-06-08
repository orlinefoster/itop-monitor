import { useState, useEffect } from 'react'
import { fetchFilters } from '../api.js'

export default function FilterBar({ onChange }) {
  const [orgs, setOrgs] = useState([])
  const [teams, setTeams] = useState([])
  const [agents, setAgents] = useState([])

  const [selOrg, setSelOrg] = useState('')
  const [selTeam, setSelTeam] = useState('')
  const [selAgent, setSelAgent] = useState('')

  // Load orgs on mount
  useEffect(() => {
    fetchFilters().then(d => {
      setOrgs(d.organizations ?? [])
      setTeams(d.teams ?? [])
      setAgents(d.agents ?? [])
    }).catch(() => {})
  }, [])

  // Reload teams/agents when org changes
  useEffect(() => {
    if (!selOrg) return
    fetchFilters(selOrg).then(d => {
      setTeams(d.teams ?? [])
    }).catch(() => {})
  }, [selOrg])

  // Reload agents when team changes
  useEffect(() => {
    if (!selTeam) return
    fetchFilters(null, selTeam).then(d => {
      setAgents(d.agents ?? [])
    }).catch(() => {})
  }, [selTeam])

  function handleChange() {
    onChange({
      org_id: selOrg || null,
      team_id: selTeam || null,
      agent_id: selAgent || null,
    })
  }

  // Debounce: fire onChange after selection settles
  useEffect(() => {
    handleChange()
  }, [selOrg, selTeam, selAgent])

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">organización</label>
        <select
          className="filter-select"
          value={selOrg}
          onChange={e => { setSelOrg(e.target.value); setSelTeam(''); setSelAgent('') }}
        >
          <option value="">Todas</option>
          {orgs.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">grupo</label>
        <select
          className="filter-select"
          value={selTeam}
          onChange={e => { setSelTeam(e.target.value); setSelAgent('') }}
        >
          <option value="">Todos</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">analista</label>
        <select
          className="filter-select"
          value={selAgent}
          onChange={e => setSelAgent(e.target.value)}
        >
          <option value="">Todos</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
