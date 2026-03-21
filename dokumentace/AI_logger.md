# Dokumentace: `AI/logger.py`

Tento modul zajišťuje **trvalé ukládání (persistování) konverzačních logů a interakcí moderačního systému** napříč uživateli aplikace. Je nepostradatelný k tvorbě chráněné administrační zóny, kde lze přehrávat staré průchody simulátoru a sledovat, jak umělá inteligence vyhodnocovala řešené postupy. Logy jsou zapisovány do k tomu určené složky (`data/logs`).

## Implementace a bezpečné sdílení I/O operací

Protože aplikace zprostředkovaná přes backend framework Flask dokáže obsluhovat v jednom čase desítky uživatelů asynchronně (paralelně), dříve nebo později by poškodila standardní souborový zápis (`open`). Souborový zámek, neboli package `filelock`, blokuje veškeré I/O operace do chvíle, než předchozí skript skončí se zápisy/čtením konkrétního `{user_id}.json` souboru s časovým out limitem 10 sekund.

Všechny funkce otevírají tento zámek skrze blok `with lock:` a teprve poté zavolají skutečnou read/write implementaci z interních funkcí `_read_log_unlocked` nebo `_write_log_unlocked`.

## Životní cyklus konverzace (hlavní exporty)

1. **`start_conversation(user_id, conv_type, metadata)`**:
   Když uživatel vstoupí do chatu nebo scénáře, vygeneruje se jedinečné ID z kombinace preffixu účelu a aktuálního času ve formátu ISO (`ask_2026...`). Tento záznam založen uvnitř pole `.json` uživatele k budoucímu vkládání zpráv. Funkce nakonec vrátí vygenerované ID stringem s odchytem chyb.

2. **`log_message(user_id, conv_id, role, content, extra)`**:
   Pro existující `conv_id` a `user_id` nahraje nově řečenou zprávu (od tvůrce v argumentu `role` - tzn. `user` nebo `ai`). Přes parameter dictu `extra` se dá zároveň přidat neomezený balík vnořených informací: obvykle zprávy o blocích generované AI ohledně skóre či safety blokačního incidentu. Zprávy ukládá v čase pomocí `datetime.now().isoformat()`.

3. **`end_conversation(user_id, conv_id, summary)`**:
   Uzavře daný profil pro vyhodnocování. Zapíše do záznamu ISO datum konce (`ended_at`) a připojí závěrečný report `summary`. (Z něho lze např. získat informaci, kolik uživatel v tomto dřívějším pokusu reálně nashromáždil zkušenostních XP bodů.)
