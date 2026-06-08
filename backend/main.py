"""
iTOP Monitor — Backend API

Exposes dashboard data computed from iTOP tickets.
Data is cached in SQLite and refreshed by a background thread.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import CacheRefresher, get_cache, set_cache
from itop_client import ItopClient, ItopError
from models import (
    AgentSummary,
    AgentWeekly,
    DashboardData,
    FilterData,
    FilterOption,
    FlowDay,
    FlowData,
    TeamStats,
    Ticket,
    WeeklySummary,
)

# ── App setup ────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="iTOP Monitor", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

itop = ItopClient()

# ── Data assembly ───────────────────────────────────────────


def _pick(d: dict, *keys: str) -> dict:
    """Safely pick keys from a dict, returning empty string for missing keys."""
    return {k: d.get(k, "") for k in keys}


def _agent_name_from_raw(raw: dict) -> str:
    """Extract agent name from a raw iTop dict, trying known field names."""
    return (
        raw.get("agent_id_friendlyname")
        or raw.get("agent_name")
        or ""
    )


def _resolve_agent_names(
    raw_list: list[dict[str, Any]],
) -> dict[str, str]:
    """
    Batch-resolve agent names from iTop Person records.

    For any raw ticket dict whose agent name is empty, look up the
    Person by agent_id and return a dict: agent_id → friendlyname.
    """
    ids_to_fetch = set()
    for r in raw_list:
        aid = str(r.get("agent_id", ""))
        if aid and aid != "0" and not _agent_name_from_raw(r):
            ids_to_fetch.add(aid)

    if not ids_to_fetch:
        return {}

    try:
        oql = "SELECT Person WHERE id IN (" + ",".join(ids_to_fetch) + ")"
        persons = itop.get("Person", key=oql, output_fields="id, friendlyname")
        return {str(p["id"]): p.get("friendlyname", "") for p in persons}
    except ItopError:
        logger.warning("Failed to resolve %d agent names", len(ids_to_fetch))
        return {}


def _ticket_from_raw(raw: dict, name_map: dict[str, str] | None = None) -> Ticket:
    """Convert a raw iTop UserRequest dict into our Ticket model."""
    agent_id = str(raw.get("agent_id", ""))
    agent_name = _agent_name_from_raw(raw)
    if not agent_name and name_map:
        agent_name = name_map.get(agent_id, "")

    return Ticket(
        id=str(raw.get("id", "")),
        friendlyname=raw.get("friendlyname", ""),
        title=raw.get("title", ""),
        status=raw.get("status", ""),
        agent_id=agent_id,
        agent_name=agent_name,
        caller_name=raw.get("caller_id_friendlyname", ""),
        urgency=raw.get("urgency", ""),
        impact=raw.get("impact", ""),
        priority=raw.get("priority", ""),
        start_date=raw.get("start_date", ""),
        last_update=raw.get("last_update", ""),
        sla_deadline=raw.get("sla_tto_deadline", ""),
    )


def build_dashboard() -> dict[str, Any]:
    """
    Fetch data from iTOP and compute all dashboard values.
    This is called by the background refresher.
    """
    agent_id = settings.agent_id
    team_id = settings.team_id
    wip_max = settings.wip_max_per_agent
    today = datetime.now().strftime("%Y-%m-%d")

    # ── Fetch active tickets ─────────────────────────────
    try:
        all_tickets_raw = itop.get_active_tickets(team_id=team_id or None)
    except ItopError as e:
        logger.error("iTOP error fetching tickets: %s", e)
        all_tickets_raw = []

    name_map = _resolve_agent_names(all_tickets_raw)
    tickets = [_ticket_from_raw(t, name_map) for t in all_tickets_raw]

    # ── My tickets ───────────────────────────────────────
    my_tickets = [t for t in tickets if agent_id is not None and t.agent_id == str(agent_id)]

    # ── Per-agent aggregation ────────────────────────────
    agent_map: dict[str, dict] = {}
    for t in tickets:
        aid = t.agent_id or "unassigned"
        if aid not in agent_map:
            agent_map[aid] = {
                "agent_id": aid,
                "agent_name": (
                    "Sin asignar" if aid in ("0", "unassigned", "")
                    else t.agent_name or f"Agente {aid}"
                ),
                "pending": 0,
                "resolved_today": 0,
                "overdue": 0,
            }
        agent_map[aid]["pending"] += 1
        # NOTE: resolved_today requires a separate query or a wider OQL scope
        # For now we keep it as a placeholder.

    agents_list = [
        AgentSummary(
            agent_id=v["agent_id"],
            agent_name=v["agent_name"],
            pending=v["pending"],
            resolved_today=v["resolved_today"],
            overdue=v["overdue"],
            wip_limit=wip_max,
            wip_ok=v["pending"] <= wip_max,
        )
        for v in agent_map.values()
    ]

    # Sort: most loaded first
    agents_list.sort(key=lambda a: a.pending, reverse=True)

    bottleneck_agents = [a.agent_name for a in agents_list if not a.wip_ok]

    total_pending = sum(a.pending for a in agents_list)
    agent_count = len(agents_list) or 1

    # ── Team stats ───────────────────────────────────────
    team_stats = TeamStats(
        total_pending=total_pending,
        total_open=total_pending,
        resolved_today=0,  # TODO: query resolved today
        avg_per_agent=round(total_pending / agent_count, 1),
        bottleneck_agents=bottleneck_agents,
        agents=agents_list,
    )

    # ── My summary ────────────────────────────────────────
    my_id_str = str(agent_id) if agent_id is not None and agent_id != 0 else ""
    my_agent = next(
        (a for a in agents_list if a.agent_id == my_id_str),
        AgentSummary(
            agent_id=my_id_str,
            agent_name=settings.agent_name,
        ),
    )

    return DashboardData(
        my_tickets=my_tickets,
        team_tickets=tickets,
        team_stats=team_stats,
        my_summary=my_agent,
        last_updated=datetime.now().isoformat(),
        refresh_seconds=settings.refresh_interval_seconds,
    ).model_dump()


# ── Background refresher ─────────────────────────────────────

refresher = CacheRefresher(build_dashboard, settings.refresh_interval_seconds)


@app.on_event("startup")
async def startup():
    # Do an initial fetch synchronously so we have data immediately
    logger.info("Initial data fetch...")
    try:
        data = build_dashboard()
        set_cache("dashboard", data)
    except Exception as e:
        logger.warning("Initial fetch failed, will retry in background: %s", e)
    refresher.start()


@app.on_event("shutdown")
async def shutdown():
    refresher.stop()


# ── API endpoints ────────────────────────────────────────────


@app.get("/api/dashboard")
def get_dashboard() -> dict:
    """Return the cached dashboard data."""
    data = get_cache("dashboard")
    if data is None:
        return {"error": "No data yet. Waiting for first refresh..."}
    return data


@app.get("/api/refresh")
def force_refresh() -> dict:
    """Force an immediate data refresh (useful for testing)."""
    try:
        data = build_dashboard()
        set_cache("dashboard", data)
        return {"status": "ok", "last_updated": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


# ── Filters & Weekly endpoints ───────────────────────────────


@app.get("/api/filters")
def get_filters(org_id: int | None = None, team_id: int | None = None) -> dict:
    """Return available organizations, teams, and agents for the filter bar."""
    try:
        orgs_raw = itop.get_organizations()
        teams_raw = itop.get_teams(org_id=org_id)
        agents_raw = itop.get_agents(team_id=team_id)
    except ItopError as e:
        logger.error("iTOP error fetching filters: %s", e)
        return FilterData().model_dump()

    data = FilterData(
        organizations=[
            FilterOption(id=str(o["id"]), name=o.get("friendlyname", o.get("name", "?")))
            for o in orgs_raw
        ],
        teams=[
            FilterOption(id=str(t["id"]), name=t.get("friendlyname", t.get("name", "?")))
            for t in teams_raw
        ],
        agents=[
            FilterOption(id=str(a["id"]), name=a.get("friendlyname", "?"))
            for a in agents_raw
        ],
    )
    return data.model_dump()


@app.get("/api/weekly")
def get_weekly(
    org_id: int | None = None,
    team_id: int | None = None,
    agent_id: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict:
    """Weekly summary: new, open, resolved tickets, per-agent breakdown.
    If date_from/date_to are omitted, defaults to current week (Mon-Sun).
    """
    import datetime as dt

    if date_from:
        since = date_from
        until = date_to if date_to else date_from  # if no end, show single-day range
    else:
        today = dt.date.today()
        week_start = today - dt.timedelta(days=today.weekday())
        since = week_start.isoformat()
        until = date_to or (week_start + dt.timedelta(days=6)).isoformat()

    try:
        new_raw = itop.get_weekly_new_tickets(
            since, date_to=until, org_id=org_id, team_id=team_id, agent_id=agent_id
        )
        resolved_raw = itop.get_weekly_resolved_tickets(
            since, date_to=until, org_id=org_id, team_id=team_id, agent_id=agent_id
        )
        active_oql = "SELECT UserRequest WHERE status NOT IN ('closed','resolved')"
        if org_id:
            active_oql += f" AND org_id = {org_id}"
        if team_id:
            active_oql += f" AND team_id = {team_id}"
        if agent_id:
            active_oql += f" AND agent_id = {agent_id}"
        active_raw = itop.get("UserRequest", key=active_oql,
                              output_fields="id, agent_id, friendlyname, status")
    except ItopError as e:
        logger.error("iTOP error in weekly query: %s", e)
        new_raw = resolved_raw = active_raw = []

    # ── Resolve agent names ──
    combined_raw = list(new_raw) + list(resolved_raw) + list(active_raw)
    name_map = _resolve_agent_names(combined_raw)

    def name_of(raw: dict) -> str:
        n = _agent_name_from_raw(raw)
        if not n:
            n = name_map.get(str(raw.get("agent_id", "")), "")
        return n

    # ── Per-agent aggregation ──
    agent_map: dict[str, dict] = {}

    def ensure(aid: str, n: str):
        if aid and aid not in agent_map:
            agent_map[aid] = {
                "agent_id": aid,
                "agent_name": (
                    "Sin asignar" if aid in ("0", "unassigned", "")
                    else n or f"Agente {aid}"
                ),
                "new_assigned": 0,
                "resolved": 0,
                "total_active": 0,
            }

    for t in new_raw:
        aid = str(t.get("agent_id", "")) or "unassigned"
        ensure(aid, name_of(t))
        agent_map[aid]["new_assigned"] += 1

    for t in resolved_raw:
        aid = str(t.get("agent_id", "")) or "unassigned"
        ensure(aid, name_of(t))
        agent_map[aid]["resolved"] += 1

    for t in active_raw:
        aid = str(t.get("agent_id", "")) or "unassigned"
        ensure(aid, name_of(t))
        agent_map[aid]["total_active"] += 1

    agents_list = [
        AgentWeekly(**v).model_dump()
        for v in sorted(agent_map.values(), key=lambda x: x["total_active"], reverse=True)
    ]

    return WeeklySummary(
        week_start=since,
        week_end=until,
        new_tickets=len(new_raw),
        open_tickets=sum(1 for t in active_raw if t.get("status") != "resolved"),
        resolved_tickets=len(resolved_raw),
        total_active=len(active_raw),
        agents=agents_list,
    ).model_dump()


# ── Flow endpoint (timeline chart) ────────────────────────────


def _team_name_of(raw: dict) -> str:
    """Extract team name from raw iTOP data."""
    return raw.get("team_id_friendlyname") or raw.get("team_name") or ""


def _resolve_team_names(raw_list: list[dict]) -> dict[str, str]:
    """Build a team_id → name map from raw ticket data, falling back to
    a Team fetch for any IDs we don't have names for."""
    team_map: dict[str, str] = {}
    ids_without_name: set[str] = set()

    for r in raw_list:
        tid = str(r.get("team_id", ""))
        if not tid or tid == "0":
            continue
        name = _team_name_of(r)
        if name:
            team_map[tid] = name
        else:
            ids_without_name.add(tid)

    # Fetch any unresolved team names
    if ids_without_name:
        try:
            oql = "SELECT Team WHERE id IN (" + ",".join(ids_without_name) + ")"
            teams_raw = itop.get("Team", key=oql, output_fields="id, friendlyname, name")
            for t in teams_raw:
                tid = str(t["id"])
                team_map[tid] = t.get("friendlyname") or t.get("name", tid)
        except ItopError:
            logger.warning("Failed to resolve %d team names", len(ids_without_name))

    return team_map


@app.get("/api/flow")
def get_flow(
    date_from: str | None = None,
    date_to: str | None = None,
    org_id: int | None = None,
    team_id: int | None = None,
    agent_id: int | None = None,
) -> dict:
    """Daily flow data: new tickets, resolved tickets, and cumulative pending
    over a date range, broken down by team for the pending stack.
    Defaults to the current week.
    """
    import datetime as dt

    # ── Default date range: current week ──
    if date_from:
        since = date_from
        until = date_to if date_to else date_from
    else:
        today = dt.date.today()
        week_start = today - dt.timedelta(days=today.weekday())
        since = week_start.isoformat()
        until = date_to or (week_start + dt.timedelta(days=6)).isoformat()

    team_fields = "id, status, start_date, last_update, team_id, team_id_friendlyname, agent_id"

    try:
        # Active tickets before the range (= starting backlog)
        backlog_raw = itop.get_active_tickets_before(
            since, org_id=org_id, team_id=team_id, agent_id=agent_id
        )

        # Tickets created within the range
        new_oql = (
            f"SELECT UserRequest WHERE start_date >= '{since}'"
            f" AND start_date <= '{until} 23:59:59'"
        )
        if org_id:
            new_oql += f" AND org_id = {org_id}"
        if team_id:
            new_oql += f" AND team_id = {team_id}"
        if agent_id:
            new_oql += f" AND agent_id = {agent_id}"
        new_raw = itop.get("UserRequest", key=new_oql,
                           output_fields=team_fields)

        # Tickets resolved within the range
        res_oql = (
            f"SELECT UserRequest WHERE status = 'resolved'"
            f" AND last_update >= '{since}'"
            f" AND last_update <= '{until} 23:59:59'"
        )
        if org_id:
            res_oql += f" AND org_id = {org_id}"
        if team_id:
            res_oql += f" AND team_id = {team_id}"
        if agent_id:
            res_oql += f" AND agent_id = {agent_id}"
        resolved_raw = itop.get("UserRequest", key=res_oql,
                                output_fields=team_fields)
    except ItopError as e:
        logger.error("iTOP error in flow query: %s", e)
        backlog_raw = new_raw = resolved_raw = []

    # ── Resolve team names ──
    combined = list(backlog_raw) + list(new_raw) + list(resolved_raw)
    team_map = _resolve_team_names(combined)

    # ── Helper: get team_id from raw, returning "" for none ──
    def get_tid(raw: dict) -> str:
        tid = str(raw.get("team_id", ""))
        return tid if tid and tid != "0" else ""

    # ── Build daily data points ──
    start = dt.date.fromisoformat(since)
    end = dt.date.fromisoformat(until)
    days: list[FlowDay] = []

    # Track cumulative pending per team
    team_cumulative: dict[str, int] = {}
    for t in backlog_raw:
        tid = get_tid(t)
        if tid:
            team_cumulative[tid] = team_cumulative.get(tid, 0) + 1
        else:
            team_cumulative[""] = team_cumulative.get("", 0) + 1

    total_cumulative = len(backlog_raw)

    for i in range((end - start).days + 1):
        day = start + dt.timedelta(days=i)
        day_str = day.isoformat()

        # Count new by team
        for t in new_raw:
            if t.get("start_date", "").startswith(day_str):
                tid = get_tid(t)
                team_cumulative[tid] = team_cumulative.get(tid, 0) + 1
                total_cumulative += 1

        # Count resolved by team
        for t in resolved_raw:
            if t.get("last_update", "").startswith(day_str):
                tid = get_tid(t)
                team_cumulative[tid] = team_cumulative.get(tid, 0) - 1
                total_cumulative -= 1

        # Snapshot for this day
        pending_by_team = {
            tid: count for tid, count in team_cumulative.items()
            if count > 0
        }

        new_count = sum(
            1 for t in new_raw
            if t.get("start_date", "").startswith(day_str)
        )
        resolved_count = sum(
            1 for t in resolved_raw
            if t.get("last_update", "").startswith(day_str)
        )

        days.append(FlowDay(
            date=day_str,
            new=new_count,
            resolved=resolved_count,
            pending=max(total_cumulative, 0),
            pending_by_team=pending_by_team,
        ))

    return FlowData(
        days=days,
        starting_pending=len(backlog_raw),
        teams=team_map,
    ).model_dump()


# ── Direct run ───────────────────────────────────────────────


# ── Direct run ───────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )
