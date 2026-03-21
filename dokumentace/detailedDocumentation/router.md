# Dokumentace: `router.js`

Soubor `router.js` zajišťuje v aplikaci LearNovate navigaci mezi hlavními pohledy (přehled kurzů/témat vs. detail předmětu), obsluhuje UI rozhraní pro interakci s AI (chat a scénáře) a řídí základní prezentační logiku (grid/list view).

## 1. Závislosti (Imports)
Router úzce spolupracuje s dalšími moduly:
- `state.js` – Sdílený stav aplikace (např. aktuální pohled `currentView`, přihlášený uživatel `currentUser`, aktivní předmět).
- `subjects.js` – Slouží k vykreslení domovské obrazovky přes `renderMainContent`.
- `i18n.js` – Internacionalizace a překlady (funkce `t`).
- `gamification.js` & `auth.js` – Moduly starající se o vizualizaci XP, levelů a achievementů po dokončení určitých akcí ve scénáři.

## 2. Exportované funkce (API)

### `initRouter()`
Inicializační funkce, kterou by měla zavolat hlavní smyčka aplikace. Stará se o připojení základních event listenerů:
- Tlačítko pro návrat **Domů**.
- Tlačítko pro **přepínání režimu zobrazení** (grid/list).

### `navigateHome()`
Zajišťuje návrat uživatele ze specifického předmětu zpět na výchozí domovský přehled.
- Resetuje stav (`state.currentView = 'home'`).
- Vyčistí specifické CSS třídy rozložení aktuálního předmětu.
- Znovu vyrenderuje domácí dashboard přes `renderMainContent()`.

### `navigateToSubject(categoryId, subject)`
Hlavní funkce pro přechod do „Detailu předmětu“. 
1. Upraví layout do třísloupcového nebo specifického detailního zobrazení.
2. Vykreslí dynamicky obsah předmětu (nadpisy, texty, obrázky) na základě pole `subject.content`.
3. Vykreslí a zprovozní pravý postranní panel s **AI asistentem (chatem)**. Ten umožňuje uživatelům posílat dotazy na backend (`/api/ai/ask`) pro další vysvětlení specifické látky. Na backend jsou přitom posílána i kontextová data aktuálního předmětu.

### `toggleViewMode()`
Jednoduchá UI funkce pro přepnutí seznamu položek z dlaždic (`grid`) na řádkový výpis (`list`) a naopak. Mění třídy objektů a ikonu přepínače prostřednictvím knihovny *Lucide*.

## 3. Herní a výukové AI scénáře

### Uvnitř skrytá funkce: `startScenario(subject)`
Tato funkce je spouštěna tlačítkem „Spustit scénář“ (startScenarioBtn) a transformuje aplikaci na **interaktivní chatový scénář**, kde se uživatel učí prostřednictvím dialogu s „AI scénáristou“.

**Fungování a životní cyklus scénáře:**
1. **Inicializace UI:** Překreslí hlavní obsah do jednoho sloupce pro chatovou interakci s vizuálním ukazatelem milníků scénáře.
2. **`autoStart()`:** Automaticky vyvolá backendový endpoint `/api/ai/scenario/start` k nastartování scénáře a získá uvítací zprávu umělé inteligence.
3. **`sendStep()`:** Bere uživatelský vstup, zamyká UI proti vícenásobnému odeslání a odesílá data na `/api/ai/scenario/step`.
4. **Gamifikace:** Během odpovědí kontroluje router informaci o tom, zdali by dosažen „milník“. Pokud ano, vykreslí se milníkový banner, započtou se body (XP), odesílá se asynchronní požadavek na zisk/potvrzení zkušeností na backend a případně se spouští animace k postupu na další level či zisku achievementu.
5. **Konec scénáře:** Funkce `showEndBanner()` uživateli pogratuluje, umožní mu buď scénář opakovat na čisto, nebo se vrátit k teoretické látce v `navigateToSubject()`.

## 4. Práce s DOMem a animacemi
Router přímo manipuluje s DOM elementy pomocí ID a tříd. Používá knihovnu Lucide ikonek (`lucide.createIcons`). Často využívá `scrollHeight` pro autogrow chování textarea inputů a automatický scroll zpráv v AI chatu dolů k nejnovějším zprávám.
