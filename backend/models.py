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
    pending: int = 0           # assigned + pending
    resolved_today: int = 0    # resolved today
    overdue: int = 0           # past SLA
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
