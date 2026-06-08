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
