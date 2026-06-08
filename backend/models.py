from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class Ticket(BaseModel):
    """A single ticket from iTOP (UserRequest)"""
    id: str
    ref: str = Field(alias="friendlyname", default="")
    title: str = ""
    status: str = ""
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    caller_name: Optional[str] = None
    urgency: str = ""
    impact: str = ""
    priority: Optional[str] = None
    start_date: Optional[str] = None
    last_update: Optional[str] = None
    sla_deadline: Optional[str] = None

    class Config:
        populate_by_name = True


class AgentSummary(BaseModel):
    """Per-agent aggregated stats"""
    agent_id: str
    agent_name: str
    pending: int = 0
    resolved_today: int = 0
    overdue: int = 0
    wip_limit: int = 6
    wip_ok: bool = True


class TeamStats(BaseModel):
    """Overall team / office stats"""
    total_pending: int = 0
    total_open: int = 0
    resolved_today: int = 0
    avg_per_agent: float = 0.0
    bottleneck_agents: list[str] = []
    agents: list[AgentSummary] = []


class DashboardData(BaseModel):
    """Full response for the main dashboard"""
    my_tickets: list[Ticket] = []
    team_tickets: list[Ticket] = []
    team_stats: TeamStats = TeamStats()
    my_summary: AgentSummary = AgentSummary(
        agent_id="0", agent_name="Vos"
    )
    last_updated: str = datetime.now().isoformat()
    refresh_seconds: int = 30


# ── New models for filters and weekly dashboard ────────────

class FilterOption(BaseModel):
    id: str
    name: str


class FilterData(BaseModel):
    organizations: list[FilterOption] = []
    teams: list[FilterOption] = []
    agents: list[FilterOption] = []


class AgentWeekly(BaseModel):
    agent_id: str
    agent_name: str
    new_assigned: int = 0
    resolved: int = 0
    total_active: int = 0


class WeeklySummary(BaseModel):
    """Weekly dashboard response"""
    week_start: str = ""
    week_end: str = ""
    new_tickets: int = 0
    open_tickets: int = 0
    resolved_tickets: int = 0
    total_active: int = 0
    agents: list[AgentWeekly] = []
    last_updated: str = datetime.now().isoformat()


# ── Flow / timeline models ───────────────────────────────────


class FlowDay(BaseModel):
    date: str
    new: int = 0
    resolved: int = 0
    pending: int = 0
    pending_by_team: dict[str, int] = {}  # team_id → count


class FlowData(BaseModel):
    days: list[FlowDay] = []
    starting_pending: int = 0
    teams: dict[str, str] = {}  # team_id → team_name
