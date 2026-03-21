# Dokumentace: `AI/configAI.py`

Základní konfigurační modul obsluhující **zavedení OpenAI klienta** a načítání definic promptů a scénářů z lokálního úložiště.

## Hlavní povinnosti skriptu

### 1. Inicializace prostředí (.env)
Aby se klíče k API (a zejména pak `OPENAI_API_KEY`) nikdy nekomitovaly do verzovacího systému, načítá se `dotenv` proměnná. Pomocí zabudované standardní knihovny `pathlib` modul chytře projde celou adresářovou strukturu a dohledá soubor `.env` v root adresáři (dvě úrovně nad backEnd adresářem), případně rovnou ohlásí neexistenci.

K API klíči z enviromentu zavolá `get_client()` – provede instanciaci oficiálního `OpenAI` synchronního klienta a tu navrátí pro použití v hlavním flask `api.py`.

### 2. Načítání JSON promptů a scénářů
Jelikož je žádoucí nestavět obrovské stringové prompty přímo dovnitř Python kódu (kód se tak stává nepřehledným a špatně upravovatelným pro lidi bez znalosti programování), slouží `configAI.py` jako proxy zvedač těchto materiálů ze sousední dynamické složky `prompts/`. Obsahuje funkce:
- **`load_system_prompt()`**: Zvedne ze souborového systému soubor `whoYouAre.json` – hlavní instrukci, která se LLM přiděluje při zakládání scénáře coby *system* message (určí jeho personu).
- **`load_chat_prompt()`**: Totéž, nicméně tahá odlehčený profil `chatAssistant.json` pro API koncový bod volného chatu v teorii.
- **`load_scenario(scenario_name)`**: Univerzální metoda, která na vstupu dostane ID scénáře a natáhne jeho konkrétní situaci a milníky ze subsložky `prompts/scenarios/`. (Z té se poté dá vytěžit kontext v `api.py`).

V případě nenalezení souborů poctivě probublává výjimka `FileNotFoundError` (nebo `ValueError` při chybějícím klíči API) užitečná k rychlému debuggingu, navíc je v chybové hlášce logována rovnou i vyhodnocená OS platforma (`sys.platform`).
