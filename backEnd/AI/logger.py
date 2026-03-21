"""
LearNovate – Conversation Logger
Logs all conversations per user to data/logs/{user_id}.json
"""

import json
from pathlib import Path
from datetime import datetime
from filelock import FileLock

LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "logs"


def _get_log_path(user_id):
    return LOGS_DIR / f"{user_id}.json"


def _get_lock_path(user_id):
    return str(_get_log_path(user_id)) + ".lock"


def _read_log_unlocked(path):
    """Read without lock — caller must hold lock."""
    if not path.exists():
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_log_unlocked(path, data):
    """Write without lock — caller must hold lock."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def start_conversation(user_id, conv_type, metadata=None):
    """
    Create a new conversation entry. Returns conversation ID.
    """
    path = _get_log_path(user_id)
    lock = FileLock(_get_lock_path(user_id), timeout=10)

    conv_id = f"{conv_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        with lock:
            conversations = _read_log_unlocked(path)

            conversation = {
                "id": conv_id,
                "type": conv_type,
                "started_at": datetime.now().isoformat(),
                "ended_at": None,
                "metadata": metadata or {},
                "messages": [],
            }

            conversations.append(conversation)
            _write_log_unlocked(path, conversations)

        print(f"[LOGGER] New conversation: {conv_id} for user {user_id}")
        return conv_id

    except Exception as e:
        print(f"[LOGGER] ERROR in start_conversation: {e}")
        return conv_id  # Return ID anyway so step logging can try


def log_message(user_id, conv_id, role, content, extra=None):
    """
    Append a message to an existing conversation.
    """
    if not conv_id:
        return

    path = _get_log_path(user_id)
    lock = FileLock(_get_lock_path(user_id), timeout=10)

    try:
        with lock:
            conversations = _read_log_unlocked(path)
            conv = next((c for c in conversations if c["id"] == conv_id), None)
            if not conv:
                print(f"[LOGGER] WARNING: Conversation {conv_id} not found")
                return

            message = {
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat(),
            }
            if extra:
                message["extra"] = extra

            conv["messages"].append(message)
            _write_log_unlocked(path, conversations)

    except Exception as e:
        print(f"[LOGGER] ERROR in log_message: {e}")


def end_conversation(user_id, conv_id, summary=None):
    """Mark conversation as ended."""
    if not conv_id:
        return

    path = _get_log_path(user_id)
    lock = FileLock(_get_lock_path(user_id), timeout=10)

    try:
        with lock:
            conversations = _read_log_unlocked(path)
            conv = next((c for c in conversations if c["id"] == conv_id), None)
            if not conv:
                return

            conv["ended_at"] = datetime.now().isoformat()
            if summary:
                conv["summary"] = summary
            _write_log_unlocked(path, conversations)

        print(f"[LOGGER] Conversation ended: {conv_id}")

    except Exception as e:
        print(f"[LOGGER] ERROR in end_conversation: {e}")