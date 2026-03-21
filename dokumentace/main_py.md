# Dokumentace: `main.py` (CLI Prototypizace)

Soubor `main.py` na backendu reprezentuje funkčně ekvivalentní, ale technologicky maximálně odstrojený klon celého AI pipeline, se kterým by fungovalo REST webové rozhraní v API. Záměrem `main.py` je **testování prompt inženýringu a chodu scénářů** čistě formou příkazové řádky (CLI).

## Chod aplikace

1. Po spuštění zavolá `get_client()` pro napojení na jazykový model z balíčku `AI.configAI`.
2. Do paměti zavede globální prompt (`load_system_prompt()`) a načte ze složky fixní experimentální scénář na testování s názvem `car_battery`.
3. Nastartuje simulovanou konzolovou smyčku (while cyklus).
4. Sestaví pole `conversation_input` a pošle do modelu GPT první prompt, kde ho instruuje ke generování úvodní scény k vybité autobaterii.
5. Vypisuje uživateli postupně do terminálu všechny milníky o průběhu, pokud skript z textu skrze funkci `check_completion(answer)` zdetekuje speciální flagy `[MILESTONE_COMPLETE]` a `[TASK_COMPLETE]`.
6. Cyklus pokračuje přičítáním bodů a zachytáváním multiline vstupu z klávesnice, dokud se uživatel nerozhodne program killnout vecpáním textu "exit" (`if user_input.strip().lower() == "exit": break`), u čehož mu AI popřeje hezký zbytek dne. Rovněž se cyklus ukončuje ihned, pokud model odevzdá zprávu indikující finiš tasku (bodovou maximálku).
