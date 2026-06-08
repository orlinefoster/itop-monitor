"""
iTOP REST/JSON API client.

Docs: https://www.itophub.io/wiki/page?id=latest%3Aadvancedtopics%3Arest_json
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)


class ItopError(Exception):
    """Raised when iTOP API returns an error code."""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")


class ItopClient:
    """Thin wrapper around iTOP REST/JSON API."""

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.itop_url
        self.auth = (settings.itop_user, settings.itop_password)
        self.version = settings.itop_version

    # ── low-level call ──────────────────────────────────────

    def _call(self, payload: dict) -> dict[str, Any]:
        """POST to iTOP REST API and return parsed JSON."""
        url = f"{self.base_url}?version={self.version}"
        data = {
            "auth_user": settings.itop_user,
            "auth_pwd": settings.itop_password,
            "json_data": json.dumps(payload),
        }
        logger.debug("POST %s | operation=%s class=%s",
                      url, payload.get("operation"), payload.get("class", "-"))

        with httpx.Client(timeout=30) as client:
            resp = client.post(url, data=data)

        resp.raise_for_status()
        body: dict = resp.json()

        code = body.get("code", -1)
        if code != 0:
            raise ItopError(code, body.get("message", "Unknown error"))

        return body

    # ── core/get ─────────────────────────────────────────────

    def get(
        self,
        class_name: str,
        key: str | int | dict,
        output_fields: str = "*",
        limit: int = 0,
        page: int = 0,
    ) -> list[dict]:
        """
        Search iTop objects.

        Parameters
        ----------
        class_name : e.g. "UserRequest", "Person", "Team"
        key : OQL string, numeric ID, or dict of criteria
        output_fields : comma-separated or "*" or "*+"
        limit, page : pagination (0 = no limit)
        """
        payload: dict[str, Any] = {
            "operation": "core/get",
            "class": class_name,
            "key": key,
            "output_fields": output_fields,
        }
        if limit:
            payload["limit"] = limit
        if page:
            payload["page"] = page

        body = self._call(payload)
        objects = body.get("objects")
        if not objects:
            return []

        results: list[dict] = []
        for obj_key, obj_val in objects.items():
            fields = obj_val.get("fields", {})
            fields["_class"] = obj_val.get("class", class_name)
            fields["_key"] = obj_val.get("key")
            results.append(fields)

        return results

    # ── helpers ──────────────────────────────────────────────

    def get_my_id(self, email: str = "") -> int | None:
        """
        Look up your Person ID by email.
        Fallback: call with your email to auto-detect.
        """
        if not email:
            return None
        persons = self.get(
            "Person",
            key={"email": email},
            output_fields="id, friendlyname, email",
        )
        if persons:
            return int(persons[0]["id"])
        return None

    def get_active_tickets(self, team_id: int | None = None) -> list[dict]:
        """All non-closed, non-resolved UserRequests, optionally filtered by team."""
        oql = "SELECT UserRequest WHERE status NOT IN ('closed','resolved')"
        if team_id:
            oql += f" AND team_id = {team_id}"
        return self.get("UserRequest", key=oql, output_fields="*+")

    def get_active_tickets_before(
        self, date: str,
        org_id: int | None = None,
        team_id: int | None = None,
        agent_id: int | None = None,
    ) -> list[dict]:
        """Tickets that were active (not closed/resolved) before a given date."""
        oql = (
            f"SELECT UserRequest WHERE status NOT IN ('closed','resolved')"
            f" AND start_date < '{date}'"
        )
        if org_id:
            oql += f" AND org_id = {org_id}"
        if team_id:
            oql += f" AND team_id = {team_id}"
        if agent_id:
            oql += f" AND agent_id = {agent_id}"
        return self.get("UserRequest", key=oql,
                        output_fields="id, agent_id, friendlyname, status, "
                                      "team_id, team_id_friendlyname")

    def get_agent_tickets(self, agent_id: int) -> list[dict]:
        """Active tickets assigned to a specific agent."""
        oql = (
            f"SELECT UserRequest WHERE agent_id = {agent_id}"
            f" AND status NOT IN ('closed','resolved')"
        )
        return self.get("UserRequest", key=oql, output_fields="*+")

    def get_team_members(self, team_id: int) -> list[dict]:
        """Get persons belonging to a Team."""
        oql = f"SELECT Person WHERE id IN (SELECT person_id FROM lnkPersonToTeam WHERE team_id = {team_id})"
        return self.get("Person", key=oql, output_fields="id, friendlyname, email")

    # ── filters ──────────────────────────────────────────────

    def get_organizations(self) -> list[dict]:
        """All organizations (clients/departments)."""
        return self.get(
            "Organization",
            key="SELECT Organization",
            output_fields="id, friendlyname, name, code",
        )

    def get_teams(self, org_id: int | None = None) -> list[dict]:
        """All teams, optionally filtered by organization."""
        oql = "SELECT Team"
        if org_id:
            oql += f" WHERE org_id = {org_id}"
        return self.get(
            "Team", key=oql, output_fields="id, friendlyname, name, org_id"
        )

    def get_agents(self, team_id: int | None = None) -> list[dict]:
        """Persons who can be agents, optionally filtered by team."""
        if team_id:
            oql = (
                "SELECT Person WHERE id IN"
                f" (SELECT person_id FROM lnkPersonToTeam WHERE team_id = {team_id})"
            )
        else:
            oql = "SELECT Person"
        return self.get(
            "Person", key=oql, output_fields="id, friendlyname, email, org_id"
        )

    # ── weekly stats ─────────────────────────────────────────

    def get_weekly_new_tickets(
        self, date_from: str, date_to: str | None = None,
        org_id: int | None = None,
        team_id: int | None = None, agent_id: int | None = None,
    ) -> list[dict]:
        """Tickets created in a date range, with optional filters."""
        oql = f"SELECT UserRequest WHERE start_date >= '{date_from}'"
        if date_to:
            oql += f" AND start_date <= '{date_to} 23:59:59'"
        if org_id:
            oql += f" AND org_id = {org_id}"
        if team_id:
            oql += f" AND team_id = {team_id}"
        if agent_id:
            oql += f" AND agent_id = {agent_id}"
        return self.get("UserRequest", key=oql,
                        output_fields="id, friendlyname, title, status, "
                                      "agent_id, org_id, team_id, start_date")

    def get_weekly_resolved_tickets(
        self, date_from: str, date_to: str | None = None,
        org_id: int | None = None,
        team_id: int | None = None, agent_id: int | None = None,
    ) -> list[dict]:
        """Tickets resolved in a date range, with optional filters."""
        oql = f"SELECT UserRequest WHERE status = 'resolved' AND last_update >= '{date_from}'"
        if date_to:
            oql += f" AND last_update <= '{date_to} 23:59:59'"
        if org_id:
            oql += f" AND org_id = {org_id}"
        if team_id:
            oql += f" AND team_id = {team_id}"
        if agent_id:
            oql += f" AND agent_id = {agent_id}"
        return self.get("UserRequest", key=oql,
                        output_fields="id, friendlyname, title, status, "
                                      "agent_id, org_id, team_id, start_date, last_update")
