from AI.configAI import get_client, load_system_prompt, load_scenario

def main():
    client = get_client()
    system_prompt = load_system_prompt()
    scenario = load_scenario("car_battery")

    # Sestavení messages – system prompt + kontext scénáře
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

    # První zpráva od AI – zahájení scénáře
    print("AI přemýšlí...\n")
    messages.append({"role": "user", "content": "Zahaj scénář."})
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

    # Hlavní smyčka konverzace
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

        # Přidání do historie a volání API
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

        print("-" * 50)
        print(f"AI: {answer}")
        print("-" * 50)


if __name__ == "__main__":
    main()