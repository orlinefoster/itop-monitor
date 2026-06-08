"""
Secure credential storage via Windows Credential Manager.

Uses the `keyring` library which stores secrets encrypted at
OS level (DPAPI on Windows). The password is NEVER in plain text —
neither in .env nor in any source file.
"""
from __future__ import annotations

import logging
import sys

import keyring

logger = logging.getLogger(__name__)

# ── Identifiers for the credential ──────────────────────────
SERVICE_NAME = "itop-monitor"
USERNAME_KEY = "itop_password"


def get_password() -> str | None:
    """Read iTOP password from Windows Credential Manager."""
    try:
        return keyring.get_password(SERVICE_NAME, USERNAME_KEY)
    except Exception as exc:
        logger.warning("Failed to read credential: %s", exc)
        return None


def set_password(password: str) -> bool:
    """Store iTOP password in Windows Credential Manager.

    Once saved, the password is encrypted and tied to the current
    Windows user. Only this user / this machine can decrypt it.
    """
    try:
        keyring.set_password(SERVICE_NAME, USERNAME_KEY, password)
        logger.info("Password stored securely in Windows Credential Manager.")
        return True
    except Exception as exc:
        logger.error("Failed to store credential: %s", exc)
        return False


def delete_password() -> bool:
    """Remove the stored credential."""
    try:
        keyring.delete_password(SERVICE_NAME, USERNAME_KEY)
        logger.info("Credential removed.")
        return True
    except keyring.errors.PasswordDeleteError:
        logger.info("No credential to remove.")
        return False
    except Exception as exc:
        logger.error("Failed to delete credential: %s", exc)
        return False
