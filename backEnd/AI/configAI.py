import os
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
print(f"Hledám .env na: {env_path}")
print(f"Soubor existuje: {env_path.exists()}")
load_dotenv(dotenv_path=env_path)

def get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY není nastaven v .env souboru")
    return OpenAI(api_key=api_key)

def load_system_prompt() -> dict:
    prompt_path = Path(__file__).resolve().parent / "prompts" / "whoYouAre.json"
    with open(prompt_path, "r", encoding="utf-8") as f:
        return json.load(f)