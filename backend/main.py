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
from models import AgentSummary, DashboardData, TeamStats, Ticket

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


def _ticket_from_raw(raw: dict) -> Ticket:
    """Convert a raw iTop UserRequest dict into our Ticket model."""
    return Ticket(
        id=str(raw.get("id", "")),
        friendlyname=raw.get("friendlyname", ""),
        title=raw.get("title", ""),
        status=raw.get("status", ""),
        agent_id=str(raw.get("agent_id", "")),
        agent_name=raw.get("agent_name", ""),
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

    tickets = [_ticket_from_raw(t) for t in all_tickets_raw]

    # ── My tickets ───────────────────────────────────────
    my_tickets = [t for t in tickets if t.agent_id == str(agent_id)]

    # ── Per-agent aggregation ────────────────────────────
    agent_map: dict[str, dict] = {}
    for t in tickets:
        aid = t.agent_id or "unassigned"
        if aid not in agent_map:
            agent_map[aid] = {
                "agent_id": aid,
                "agent_name": t.agent_name or f"Agente {aid}",
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
    my_agent = next(
        (a for a in agents_list if a.agent_id == str(agent_id)),
        AgentSummary(agent_id=str(agent_id), agent_name=settings.agent_name),
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
