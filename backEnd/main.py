from AI.configAI import get_client, load_system_prompt, load_scenario

def check_completion(answer: str) -> tuple[str, bool]:
    if "[TASK_COMPLETE]" in answer:
        clean_answer = answer.replace("[TASK_COMPLETE]", "").strip()
        return clean_answer, True
    return answer, False

def main():
    client = get_client()
    system_prompt = load_system_prompt()
    scenario = load_scenario("car_battery")

    conversation_input = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                f"Scenario: {scenario['scenario']['setting']}\n"
                f"Objective: {scenario['scenario']['objective']}\n"
                f"Tutorial read by user: {scenario['scenario']['tutorial']}\n\n"
                "Start the scenario."
            )
        }
    ]

    print("=" * 50)
    print("  AI Instructor - CLI prototype")
    print("=" * 50)
    print("  (type 'exit' to quit)")
    print()

    print("AI is thinking...\n")
    
    response = client.responses.create(
        model="gpt-5.4",
        input=conversation_input,
        reasoning={"effort": "none"},
        temperature=0.7,
        max_output_tokens=500
    )
    
    answer = response.output_text
    
    conversation_input.append({
        "role": "assistant", 
        "phase": "final_answer", 
        "content": answer
    })
    
    print("-" * 50)
    print(f"AI: {answer}")
    print("-" * 50)

    while True:
        print("\nYour turn (press Enter twice to submit):")
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
            print("Ending session. Thanks for training!")
            break

        if not user_input.strip():
            print("No input provided.")
            continue

        conversation_input.append({"role": "user", "content": user_input})

        print("\nAI is thinking...\n")
        
        response = client.responses.create(
            model="gpt-5.4",
            input=conversation_input,
            reasoning={"effort": "none"},
            temperature=0.7,
            max_output_tokens=500
        )

        answer = response.output_text
        
        conversation_input.append({
            "role": "assistant", 
            "phase": "final_answer", 
            "content": answer
        })

        answer, completed = check_completion(answer)

        print("-" * 50)
        print(f"AI: {answer}")
        print("-" * 50)

        if completed:
            print("\n" + "=" * 50)
            print("  TASK COMPLETED!")
            print("=" * 50)
            break

if __name__ == "__main__":
    main()