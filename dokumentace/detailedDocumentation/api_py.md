# Dokumentace: `api.py`

Soubor `api.py` je **hlavní přístupový bod (entry point) pro Python backend aplikace** běžící na frameworku Flask. Obsluhuje veškerou logiku týkající se AI (chat, generování a obsluha scénářů) a taktéž vystavuje speciální chráněné (heslem zabezpečené) admin rozhraní.

## Architektura a integrace
- Inicializuje instanci aplikace `Flask` a nastavuje pro ni CORS (sdílení mezi zdroji).
- Ihned při startu skriptu se snaží nahodit spojení (clienta) pro AI pomocí příkazů balíku `AI.configAI`. Pokud se toto nezdaří (např. chybí API token, nebo je nedostupný server), nastartuje Flask každopádně a zapíše `_ai_ready = False`. Na veškeré další dotazy na AI potom odpovídá status kódem HTTP 503.
- Stará se o napojení tzv. JWT (JSON Web Tokens) autentizace z `req.headers`. Odkódovává klíč, aby z žádajících uživatelů vytáhl `id`. Kódování provádí pevným klíčem `'learnovate-dev-secret'`. Ostré heslování/autentifikaci přímo vůči databázi nicméně neobstarává tento soubor samostatně, o to se zřejmě postará frontend gateway / proxy.

## Hlavní Endpointy pro uživatele

### 1. `/ask` (Metoda `POST`)
Odpovídá na běžný dotaz v rámci detailu předmětu (pravý postranní chat modul v routeru dopsaném do frontendu).
- Přijme text, dosavadní historii oboustranného chatu a případný studijní *kontext* materiálu.
- **Monitoring (bezpečnost):** Text před odesláním nechá prověřit skriptem `check_input` z `AI.monitor`. Pokud zjistí, že je obsah závadný, zablokuje jej, založí pro uživatele instanci zablokované zprávy přes `logger` (pokud je přihlášený) a vrátí statickou odpověď varování. U výstupu se děje přesně to samé přes `check_output`.
- Pokud je vše v pořádku, doplní systémový promt, odešle model na backend (např. `gpt-5.4-mini`) a po zapsání logů vrátí JSON s odpovědí.

### 2. `/scenario/start` (Metoda `POST`)
Zahájí herní AI příběhový scénář. 
- Analyzuje příchozí objekty o dané situaci `scenario_data`. Pokud nepříjdou z formuláře z UI, pokusí se texty k danému statickému scénáři najít lokálně (opět přes lokální JSON definice). Kdyby se scénář úplně "pokazil" a nebylo ho z čeho nahodit, vygeneruje úvod scénáře naživo z názvu tématu.
- U přihlášených uživatelů si pro ně založí instanci do `data/logs/...` s metadaty jako `multiplier` a `repetition` za pomoci modulu `AI.scoring`.
- Vyrobí úvodní scénu, odešle dotaz na LLM a výsledek přepošle JSONem zpět na klienta (včetně polí určujících maximální milníky a bodovou distribuci odměn za scénář).

### 3. `/scenario/step` (Metoda `POST`)
Pokračuje v běžící smyčce interaktivního scénáře.
- Rozdíl oproti chatu `/ask` tkví v tom, že monitoruje skryté LLM signály v generovaném textu. Jmenovitě provolává `parse_flags()` pátrající po výrazech `[MILESTONE_COMPLETE]` a `[TASK_COMPLETE]`.
- Jestliže AI model usoudí, že uživatel zvládl správně popsat řešení jednoho dílčího problému, vygeneruje flag a endpoint zavolá metodu `award_milestone_points()`, čímž se v logu a bodovém skóre (soukromého profilu hráče) asynchronně projeví plusové body pro gamifikaci.
- Jakmile je scénář úspěšně u konce, uzavře se instance skrze `end_conversation`.

## Admin Endpointy
Sekundantní účel API: vnitřní monitoring aplikace tvůrcemi.
Zabezpečeno wrapperem `require_admin(req)`. Ověřuje, zda JWT token náleží profilu s boolean klíčem `admin = true` v lokálním souboru `users.json`.
- `/admin/verify`: Kontroluje heslo do admin okna proti bcrypt otisku pro spuštění relace.
- `/admin/users`: Projede `users.json` a vyvrhne JSON sadu profilů (odstraní hashe hesel, čímž data "zbezpeční").
- `/admin/logs/<user_id>`: Vrací plné znění uloženého listu konverzací daného hráče (`.json` na disku z modulu loggeru).
- `/admin/incidents`: Vyhledá v celém subsystému záznamů pouze ty instance konverzací, v nichž moderační firewall (`monitor.py`) zachytil nadávky formou flagu `blocked: True`. Ideální na monitorování problémových žáků.
