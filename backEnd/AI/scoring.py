"""
LearNovate – Scoring system
Handles points calculation with repetition multiplier
and user data persistence.
"""

import json
from pathlib import Path
from filelock import FileLock

# Path to shared users.json (same file Node.js uses)
# backEnd/AI/scoring.py → parent = AI → parent = backEnd → parent = vyvoj (root)
USERS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "users.json"
LOCK_FILE = str(USERS_FILE) + ".lock"

# Repetition multiplier table
REPETITION_TABLE = {
    1:  1.0,    # 100%
    2:  0.7,    # 70%
    3:  0.5,    # 50% (3-7)
    4:  0.5,
    5:  0.5,
    6:  0.5,
    7:  0.5,
    8:  1.0,    # 100% (8+)
}


def get_multiplier(repetition):
    """Get point multiplier based on repetition count."""
    if repetition <= 0:
        return 1.0
    if repetition in REPETITION_TABLE:
        return REPETITION_TABLE[repetition]
    # 8+ all get 100%
    return 1.0


def _read_users():
    """Read users.json safely."""
    if not USERS_FILE.exists():
        return []
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_users(users):
    """Write users.json safely with file lock (prevents race with Node.js)."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    lock = FileLock(LOCK_FILE, timeout=5)
    with lock:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)


def get_user_scenario_data(user_id, scenario_id):
    """Get user's repetition count and best milestones for a scenario."""
    users = _read_users()
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return None

    scenarios = user.get("scenarios", {})
    scenario_data = scenarios.get(scenario_id, {"repetitions": 0, "best_milestones": 0})
    return scenario_data


def start_scenario_run(user_id, scenario_id):
    """
    Increment repetition count when user starts a scenario.
    Returns the current repetition number and multiplier.
    """
    lock = FileLock(LOCK_FILE, timeout=5)
    with lock:
        users = _read_users()
        user = next((u for u in users if u["id"] == user_id), None)
        if not user:
            return None, None

        if "scenarios" not in user:
            user["scenarios"] = {}
        if scenario_id not in user["scenarios"]:
            user["scenarios"][scenario_id] = {"repetitions": 0, "best_milestones": 0}

        user["scenarios"][scenario_id]["repetitions"] += 1
        repetition = user["scenarios"][scenario_id]["repetitions"]

        _write_users_unlocked(users)

    multiplier = get_multiplier(repetition)
    return repetition, multiplier


def _write_users_unlocked(users):
    """Write without acquiring lock (caller already holds it)."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def award_milestone_points(user_id, scenario_id, milestone_index, milestone_points):
    """
    Award points for a completed milestone.
    Returns (points_awarded, total_body, multiplier).
    """
    lock = FileLock(LOCK_FILE, timeout=5)
    with lock:
        users = _read_users()
        user = next((u for u in users if u["id"] == user_id), None)
        if not user:
            print(f"[SCORING] User {user_id} not found!")
            return 0, 0, 0

        scenarios = user.get("scenarios", {})
        scenario_data = scenarios.get(scenario_id, {"repetitions": 1, "best_milestones": 0})
        repetition = scenario_data["repetitions"]
        multiplier = get_multiplier(repetition)

        points_awarded = int(milestone_points * multiplier)

        print(f"[SCORING] ═══════════════════════════════════════")
        print(f"[SCORING] User: {user.get('username', user_id)}")
        print(f"[SCORING] Scenario: {scenario_id}")
        print(f"[SCORING] Milestone #{milestone_index + 1}")
        print(f"[SCORING] Base points: {milestone_points}")
        print(f"[SCORING] Repetition: {repetition} → multiplier: {multiplier} ({int(multiplier * 100)}%)")
        print(f"[SCORING] Points awarded: {milestone_points} × {multiplier} = {points_awarded}")
        print(f"[SCORING] Body before: {user.get('body', 0)}")

        user["body"] = user.get("body", 0) + points_awarded

        print(f"[SCORING] Body after: {user['body']}")
        print(f"[SCORING] ═══════════════════════════════════════")

        if milestone_index + 1 > scenario_data.get("best_milestones", 0):
            scenario_data["best_milestones"] = milestone_index + 1
            user["scenarios"][scenario_id] = scenario_data

        _write_users_unlocked(users)

    return points_awarded, user["body"], multiplier