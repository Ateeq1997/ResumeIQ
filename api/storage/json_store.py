"""JSON file-based storage for resume history (uses /tmp on serverless)."""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from threading import Lock

_lock = Lock()

# Vercel serverless functions only allow writes to /tmp
_IS_SERVERLESS = bool(os.environ.get("VERCEL"))
_DEFAULT_PATH = (
    "/tmp/resume_history.json"
    if _IS_SERVERLESS
    else os.path.join(os.path.dirname(__file__), "resume_history.json")
)
HISTORY_FILE = os.environ.get("HISTORY_FILE_PATH", _DEFAULT_PATH)


def _ensure_file():
    if not os.path.exists(HISTORY_FILE):
        os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump({"items": []}, f)


def _read() -> Dict[str, Any]:
    _ensure_file()
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {"items": []}


def _write(data: Dict[str, Any]):
    _ensure_file()
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def add_history_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new analysis record. Auto-generates id and timestamp."""
    with _lock:
        data = _read()
        entry["id"] = entry.get("id") or str(uuid.uuid4())
        entry["created_at"] = entry.get("created_at") or datetime.now(timezone.utc).isoformat()
        data["items"].insert(0, entry)
        # Keep last 100 records to avoid unbounded growth
        data["items"] = data["items"][:100]
        _write(data)
        return entry


def get_history(limit: int = 50) -> List[Dict[str, Any]]:
    with _lock:
        data = _read()
        return data["items"][:limit]


def get_history_item(item_id: str) -> Dict[str, Any]:
    with _lock:
        data = _read()
        for item in data["items"]:
            if item.get("id") == item_id:
                return item
        return None


def clear_history():
    with _lock:
        _write({"items": []})
