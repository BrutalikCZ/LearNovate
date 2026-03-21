# Dokumentace: `subjects.js`

Poslední, největší a nejdůležitější vizuální komponenta z pohledu dynamických (API) dat. Modul `subjects.js` má na starosti stažení portfolia dostupných výukových témat (tzv. "předmětů") a jejich strukturované vyrenderování.

## Komunikace s API a Orchestrace
- **`loadSubjects()`**: Klíčová funkce, obvykle volaná asynchronně po startu z `app.js` (nebo znovu po přepnutí jazyka).
  - Vytvoří dotaz `fetch('/api/subjects?lang=cs')`.
  - Stáhne stromový JSON objekt (`state.subjectsData`) s kategoriemi a předměty uvnitř.
  - Spustí kaskádu renderovacích funkcí: obarvování levého bočního panelu (`renderSidebar()`), přípravu filtrů (`renderCategoryDropdown()`) a nakonec vykreslení samotných bloků do hlavní šablony (`renderMainContent()`). Pokud si prohlížeč pamatuje, že měl otevřený specifický detail předmětu, místo domácí obrazovky se jej pokusí znovu načíst (`router.navigateToSubject()`).

## Renderovací bloky
Modul sestavuje DOM převážně přes string interpolaci do `innerHTML` a dynamické tvoření kontejnerových `document.createElement()`. Pomáhá tak vyhnout se těžké závislosti na frameworku typu React nebo Vue.

### 1. `renderSidebar()`
Prochází objekt stažených dat a tvoří v levém sloupci kategorie. Každá se dá rozbalit nebo sbalit (`state.collapsed[catId]`). Položky uvnitř kategorie rovnou vybavuje listenerem na `navigateToSubject(catId, subject)` – tedy přesměrováním do příslušného interaktivního studia routeru.

### 2. `renderCategoryDropdown()`
Plní HTML select checkboxů nahoře v hlavičce (když se na mobilu nebo na desktopu otevírá nabídka skrytí témat).

### 3. `renderMainContent()` a řazení
Hlavní obrovská funkce složená ze dvou iterací. Nejdříve projde všechny existující kategorie, pro které postaví širokou sekci (nadpis, tlustá linka, rozbalovací tlačítko řazení). Posléze projde vnořené prvky dané sekce a vytvoří pro ně graficky atraktivní dlaždice (tzv. `subject-card`). Doplňuje do nich atributy `data-keywords` kvůli správnému a bleskovému fungování textového vyhledávání z modulu `sidebar.js`.

**Řazení v sekcích:**
Zahrnuje funkce `initSortButtons()` a `closeAllSortPanels()`. Tyto se nabindují na tlačítka vykreslená z `renderMainContent`. Starají se o logiku třídění daného DOM elementu flexboxových dlaždiček podle abecedy (a-z, z-a) nebo výchozího (id/indexového) pořadí skrze obalení elementů do pole a zavolání Array `.sort()`.
