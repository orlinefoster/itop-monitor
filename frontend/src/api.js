const BASE = '/api';

export async function fetchDashboard() {
  const res = await fetch(`${BASE}/dashboard`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function triggerRefresh() {
  const res = await fetch(`${BASE}/refresh`);
  return res.json();
}

export async function fetchFilters(orgId, teamId) {
  const params = new URLSearchParams()
  if (orgId) params.set('org_id', orgId)
  if (teamId) params.set('team_id', teamId)
  const res = await fetch(`${BASE}/filters?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchWeekly(orgId, teamId, agentId) {
  const params = new URLSearchParams()
  if (orgId) params.set('org_id', orgId)
  if (teamId) params.set('team_id', teamId)
  if (agentId) params.set('agent_id', agentId)
  const res = await fetch(`${BASE}/weekly?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
