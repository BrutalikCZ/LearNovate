# Dokumentace: `state.js`

Soubor `state.js` dodává aplikaci jednoduchý způsob držení a řízení sdíleného **globálního stavu** (state management) napříč všemi ES6 moduly. Jedná se de facto o alternativu k robustním správcům jako je Redux, navrženou primárně pro účely této odlehčené vanilla JS aplikace.

## Struktura globálního stavu

Objekt `state` je importován zbytkem funkcí a reaktivním způsobem (vlastní rutinou nebo modifikací vlastností z vnějšku) upravuje svou podobu. Obsahuje tyto klíče:

- **`theme`** (`'dark'` | `'light'`): Volba aktuálního barevného schematu. Načítáno prioritně z `localStorage`.
- **`lang`** (`'cs'` | `'en'`): Zvolený jazyk aplikace pro i18n, taktéž persistováno v `localStorage`.
- **`catDropOpen`** (`boolean`): Určuje, zda je v navigačním sidebaru rozbaleno menu kategorií/předmětů.
- **`categories`** (`object`): Objekt držící informaci o tom, které konkrétní kategorie obsahu jsou načteny či použity.
- **`collapsed`** (`object`): Informace o sbalených a rozbalených kategoriích ve stromové struktuře aplikace.
- **`currentUser`** (`object` | `null`): Drží data aktuálně přihlášeného uživatele (jméno, e-mail, získané body zkušeností apod.).
- **`currentView`** (`'home'` | `'subject'`): Indikuje aktuální pohled routeru (`router.js`).
- **`currentSubject`** (`object` | `null`): Pokud je uživatel v detailu předmětu (ve view `'subject'`), tento klíč drží veškerá data pro vykreslení (jeho ID, název, popis atd.).
- **`subjectsData`** (`array`): Data kurzů/předmětů po spuštění stažená ze vzdáleného API (viz `subjects.js`).
- **`viewMode`** (`'grid'` | `'list'`): Uživatelská preference zobrazení položek na domovské stránce (dlaždice nebo seznam).

Všechna data kromě `theme` a `lang` žijí vždy pouze po dobu jedné aktuální relace (nedrží se trvale v paměti).
