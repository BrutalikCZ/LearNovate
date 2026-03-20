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
   # Vstup od uživatele
    print("Tvůj dotaz (pro odeslání stiskni 2x Enter):")
    lines = []
    while True:
        line = input()
        if line == "":
            if lines:
                break
        else:
            lines.append(line)

    user_input = "\n".join(lines)

    if not user_input.strip():
        print("Nebyl zadán žádný dotaz.")
        return
 
    # Volání OpenAI API
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
 
    # Výstup
    answer = response.choices[0].message.content
    print("-" * 50)
    print(f"AI: {answer}")
    print("-" * 50)
 
 
if __name__ == "__main__":
    main()