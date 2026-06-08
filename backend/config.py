from __future__ import annotations

import logging
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from credential import get_password

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # iTOP API connection
    itop_url: str = "https://localhost/itop/webservices/rest.php"
    itop_version: str = "1.4"
    itop_user: str = ""
    itop_password_secret: str = ""  # fallback en texto plano (solo dev)

    # Your identity
    agent_id: Optional[int] = None
    agent_name: str = "Vos"
    team_id: Optional[int] = None

    # WIP limits
    wip_max_per_agent: int = 6

    # Backend
    host: str = "0.0.0.0"
    port: int = 8000
    refresh_interval_seconds: int = 30

    # ── Validators ──────────────────────────────────────────
    @field_validator("agent_id", "team_id", mode="before")
    @classmethod
    def coerce_empty_int(cls, v):
        """Convert empty string to None so Pydantic doesn't crash."""
        if v == "" or v is None:
            return None
        return int(v)

    @property
    def itop_password(self) -> str:
        """Return password from Credential Manager, falling back to .env."""
        # 1. Try Windows Credential Manager (secure)
        pw = get_password()
        if pw:
            return pw
        # 2. Fallback: .env (for dev / Linux / macOS)
        if self.itop_password_secret:
            logger.warning(
                "Using plain-text password from .env. "
                "Run 'python store_password.py' to store it securely."
            )
            return self.itop_password_secret
        return ""


settings = Settings()
