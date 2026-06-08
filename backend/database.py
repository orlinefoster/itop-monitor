"""
SQLite cache for iTOP data.

We cache the raw API responses so the frontend doesn't need to
wait for iTOP on every request. A background refresh loop updates
this cache every N seconds.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "cache.db"

# ── Schema ───────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS cache (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

# ── Connection manager (thread-safe) ─────────────────────────

_local = threading.local()


def _get_conn() -> sqlite3.Connection:
    """Get thread-local connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(str(DB_PATH))
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute(SCHEMA)
    return _local.conn


def get_cache(key: str) -> dict[str, Any] | None:
    """Read JSON from cache, return None if missing."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT value FROM cache WHERE key = ?", (key,)
    ).fetchone()
    if row is None:
        return None
    return json.loads(row["value"])


def set_cache(key: str, value: dict[str, Any]) -> None:
    """Upsert JSON into cache."""
    conn = _get_conn()
    conn.execute(
        """INSERT INTO cache (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at""",
        (key, json.dumps(value, default=str), datetime.now().isoformat()),
    )
    conn.commit()


def get_all_cache() -> dict[str, dict]:
    """Dump entire cache (for diagnostics)."""
    conn = _get_conn()
    rows = conn.execute("SELECT key, value, updated_at FROM cache").fetchall()
    return {
        row["key"]: {
            "value": json.loads(row["value"]),
            "updated_at": row["updated_at"],
        }
        for row in rows
    }


# ── Background refresh ───────────────────────────────────────

class CacheRefresher:
    """
    Periodically fetches data from iTOP and writes to cache.

    Call .start() once at app startup. The refresher runs in a
    daemon thread so it dies with the main process.
    """

    def __init__(self, refresh_func, interval: int = 30):
        self.refresh_func = refresh_func
        self.interval = interval
        self._stop_event = threading.Event()

    def start(self):
        thread = threading.Thread(target=self._loop, daemon=True)
        thread.start()
        logger.info("CacheRefresher started (interval=%ss)", self.interval)

    def stop(self):
        self._stop_event.set()

    def _loop(self):
        while not self._stop_event.is_set():
            try:
                data = self.refresh_func()
                set_cache("dashboard", data)
                logger.info("Cache refreshed at %s", datetime.now().isoformat())
            except Exception as exc:
                logger.warning("Cache refresh failed: %s", exc)
            self._stop_event.wait(self.interval)
