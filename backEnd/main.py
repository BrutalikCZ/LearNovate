from AI.configAI import get_client, load_system_prompt


def main():
    # Inicializace
    client = get_client()
    system_prompt = load_system_prompt()

    print("=" * 50)
    print("  AI Instruktor – CLI prototype")
    print("=" * 50)
    print()

    # Vstup od uživatele
    user_input = input("Tvůj dotaz: ")

    if not user_input.strip():
        print("Nebyl zadán žádný dotaz.")
        return

    print("\nAI přemýšlí...\n")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            system_prompt,
            {"role": "user", "content": user_input}
        ],
        temperature=0.7,
        max_tokens=500
    )

    answer = response.choices[0].message.content
    print("-" * 50)
    print(f"AI: {answer}")
    print("-" * 50)


if __name__ == "__main__":
    main()