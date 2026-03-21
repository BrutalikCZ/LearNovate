# configAI.py — robustnější s lepším logováním

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Najdi .env relativně k tomuto souboru, cross-platform
_base_dir = Path(__file__).resolve().parent.parent.parent
_env_path = _base_dir / ".env"

print(f"[configAI] Platform: {sys.platform}")
print(f"[configAI] Base dir: {_base_dir}")
print(f"[configAI] .env path: {_env_path}")
print(f"[configAI] .env exists: {_env_path.exists()}")

load_dotenv(dotenv_path=_env_path)


def load_chat_prompt() -> dict:
    prompt_path = Path(__file__).resolve().parent / "prompts" / "chatAssistant.json"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"Chat prompt not found at: {prompt_path}. "
            f"Platform: {sys.platform}"
        )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            f"OPENAI_API_KEY not found. "
            f"Checked .env at: {_env_path} (exists: {_env_path.exists()}). "
            f"Platform: {sys.platform}"
        )
    return OpenAI(api_key=api_key)


def load_system_prompt() -> dict:
    prompt_path = Path(__file__).resolve().parent / "prompts" / "whoYouAre.json"
    if not prompt_path.exists():
        raise FileNotFoundError(
            f"System prompt not found at: {prompt_path}. "
            f"Platform: {sys.platform}"
        )
    with open(prompt_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_scenario(scenario_name: str) -> dict:
    scenario_path = Path(__file__).resolve().parent / "prompts" / "scenarios" / f"{scenario_name}.json"
    if not scenario_path.exists():
        raise FileNotFoundError(
            f"Scenario '{scenario_name}' not found at: {scenario_path}. "
            f"Platform: {sys.platform}"
        )
    with open(scenario_path, "r", encoding="utf-8") as f:
        return json.load(f)