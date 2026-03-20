from AI.configAI import get_client, load_system_prompt, load_scenario


def check_completion(answer: str) -> tuple[str, bool]:
    """Zkontroluje zda AI označila úkol jako splněný."""
    if "[TASK_COMPLETE]" in answer:
        clean_answer = answer.replace("[TASK_COMPLETE]", "").strip()
        return clean_answer, True
    return answer, False


def main():
    client = get_client()
    system_prompt = load_system_prompt()
    scenario = load_scenario("car_battery")

    messages = [
        system_prompt,
        {
            "role": "user",
            "content": (
                f"Scénář: {scenario['scenario']['setting']}\n"
                f"Cíl: {scenario['scenario']['objective']}\n"
                f"Tutoriál který uživatel četl: {scenario['scenario']['tutorial']}\n\n"
                "Zahaj scénář."
            )
        }
    ]

    print("=" * 50)
    print("  AI Instruktor – CLI prototype")
    print("=" * 50)
    print("  (pro ukončení napiš 'exit')")
    print()

    # První zpráva od AI
    print("AI přemýšlí...\n")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7,
        max_completion_tokens=500
    )
    answer = response.choices[0].message.content
    messages.append({"role": "assistant", "content": answer})
    print("-" * 50)
    print(f"AI: {answer}")
    print("-" * 50)

    # Hlavní smyčka
    while True:
        print("\nTvůj tah (2x Enter pro odeslání):")
        lines = []
        while True:
            line = input()
            if line == "":
                if lines:
                    break
            else:
                lines.append(line)

        user_input = "\n".join(lines)

        if user_input.strip().lower() == "exit":
            print("Konec. Díky za trénink!")
            break

        if not user_input.strip():
            print("Nebyl zadán žádný dotaz.")
            continue

        messages.append({"role": "user", "content": user_input})

        print("\nAI přemýšlí...\n")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=500
        )

        answer = response.choices[0].message.content
        messages.append({"role": "assistant", "content": answer})

        # Kontrola dokončení
        answer, completed = check_completion(answer)

        print("-" * 50)
        print(f"AI: {answer}")
        print("-" * 50)

        if completed:
            print("\n" + "=" * 50)
            print("  ÚKOL SPLNĚN!")
            print("=" * 50)
            break


if __name__ == "__main__":
    main()