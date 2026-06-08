import { useState, useEffect } from 'react'
import { fetchFilters } from '../api.js'

function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function range(which) {
  const today = new Date()
  // getDay: 0=Sun, 1=Mon, …
  const monOff = today.getDay() === 0 ? -6 : 1 - today.getDay()
  switch (which) {
    case 'current-week': {
      const mon = new Date(today); mon.setDate(today.getDate() + monOff)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { from: fmtDate(mon), to: fmtDate(sun) }
    }
    case 'last-week': {
      const mon = new Date(today); mon.setDate(today.getDate() + monOff - 7)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { from: fmtDate(mon), to: fmtDate(sun) }
    }
    case 'current-month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { from: fmtDate(first), to: fmtDate(last) }
    }
    case 'last-month': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const last = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: fmtDate(first), to: fmtDate(last) }
    }
    default:
      return { from: '', to: '' }
  }
}

export default function FilterBar({ onChange }) {
  const [orgs, setOrgs] = useState([])
  const [teams, setTeams] = useState([])
  const [agents, setAgents] = useState([])

  const [selOrg, setSelOrg] = useState('')
  const [selTeam, setSelTeam] = useState('')
  const [selAgent, setSelAgent] = useState('')

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  // Fire onChange whenever filters change
  useEffect(() => {
    onChange({
      org_id: selOrg || null,
      team_id: selTeam || null,
      agent_id: selAgent || null,
      date_from: dateFrom || null,
      date_to: dateTo || null,
    })
  }, [selOrg, selTeam, selAgent, dateFrom, dateTo])

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

      {/* ── Date range ── */}
      <div className="filter-group filter-date-group">
        <label className="filter-label">rango de fechas</label>
        <div className="filter-date-inputs">
          <input
            type="date"
            className="filter-date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <span className="filter-date-sep">→</span>
          <input
            type="date"
            className="filter-date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div className="filter-date-quick">
          <button className="quick-btn" onClick={() => {
            const r = range('current-week')
            setDateFrom(r.from); setDateTo(r.to)
          }}>sem. actual</button>
          <button className="quick-btn" onClick={() => {
            const r = range('last-week')
            setDateFrom(r.from); setDateTo(r.to)
          }}>sem. pasada</button>
          <button className="quick-btn" onClick={() => {
            const r = range('current-month')
            setDateFrom(r.from); setDateTo(r.to)
          }}>mes actual</button>
          <button className="quick-btn" onClick={() => {
            const r = range('last-month')
            setDateFrom(r.from); setDateTo(r.to)
          }}>mes pasado</button>
        </div>
      </div>
    </div>
  )
}
