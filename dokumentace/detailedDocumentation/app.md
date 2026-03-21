# Dokumentace: `app.js`

Soubor `app.js` je **hlavním vstupním bodem (entry pointem)** pro frontendovou část webové aplikace LearNovate. Spojuje dohromady všechny javascriptové moduly a inicializuje je v definovaném pořadí.

## Architektura projektu
Soubor sám obsahuje popis architektury aplikačních modulů v adresáři `js/`:
- `app.js` – Orchestrace, spouštění funkcí.
- `state.js` – Globální state management.
- `i18n.js` – Dynamické přepínání jazyků a lokalizace textů.
- `theme.js` – Správa grafického tématu (světlý/tmavý režim).
- `auth.js` – Správa přihlášení, registrace uživatele, sessions a vizualizace XP baru na profilu.
- `modals.js` – Zobrazování a skrývání modálních oken (login, nastavení atp.).
- `subjects.js` – Načítání obsahu kurzů (předmětů) z backendového API a jejich renderování.
- `sidebar.js` – Interakce v levém navigačním panelu.
- `router.js` – Navigace mezi pohledy (kurzy vs. chat/scénář s AI).

## Životní cyklus při nahrání
1. **Ikony:** Inicializuje knihovnu `lucide` pro vyrenderování web font ikon.
2. **Jazyky:** Nejdříve asynchronně inicializuje modul `i18n`, aby byly k dispozici jazykové slovníky dříve, než se cokoliv dalšího začne vykreslovat.
3. **Moduly:** Postupně inicializuje vizuální režim úvodní voláním `initTheme()`, modální dialogy `initModals()`, relaci uživatele `initAuth()`, chování levého panelu `initSidebar()` a interakce routeru `initRouter()`.
4. **Data:** Na závěr zavolá `loadSubjects()`, čímž se dotáže API na dostupná výuková data a ta následně rozloží a vykreslí na domovské kartě prostřednictvím modulu `subjects.js`.
