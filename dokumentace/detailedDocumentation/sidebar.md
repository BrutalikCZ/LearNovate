# Dokumentace: `sidebar.js`

Modul `sidebar.js` spravuje chování vizuálního bočního panelu, včetně **vyhledávání**, **filtrování podle kategorií** a některých dodatečných interakcí UI hlavičky.

## Klíčové interakce postranního panelu

### 1. Globální Toast Notifikace
Modul jako první deklaruje univerzální utilitní funkci **`showToast(message)`**, která vygeneruje dočasný (mizející) prvek notifikace ve zbytcích UI. Používá se primárně po přepnutí jazyků (kdy sdělí, jaký jazyk byl zvolen). Je rovněž vystavena pro volání přes `window.showToast` případným dalším částem kódu.

### 2. Tlačítka základní hlavičky
- **Změna jazyka:** Registruje listener na tlačítko (flag/icon) `#langBtn`, čímž vyvolává přepnutí a re-aplikaci slovníků z (`i18n.js`).

### 3. Filtrovací roletka (Kategorie)
Ve výchozím stavu se na ploše objevují všechny vyučované sekce. Boční panel umožňuje určitou kategorii odškrtnout ("skrýt") z dlaždicového uspořádání. Funkce spravuje:
- Kliknutí na spouštěč menu (`#ddTrigger`), což ukáže roletku s parametry rozevření.
- Zpracování Checkbox změn uprostřed roletky (`ddPanel`). Při odškrtnutí/zaškrtnutí upraví modifikátor stavu viditelnosti dané sekce ve `state.categories` a přímo do DOMu naváže nebo odstraní vyřazující CSS třídu `hidden`.

### 4. Vyhledávací lišta (Live Search)
Poslouchá na změny vyhledávacího input boxu (`#searchInput`). Při změně vyčte dotaz a rovnou s ním naostro projde:
1. `cat-item` v sidebaru.
2. `subject-card` dlaždice na domovské stránce.
Filtrování bere v potaz nejen hlavní text obsažený v názvu, ale i klíčová slova uložená v HTML `data-keywords` atributech.
Pokud všechny karty určité sekce po vyhledání zmizí, schová vizuálně i prázdnou sekci s nadpisem (`.category-section`).

## Globální úklidové akce
Na konci modulu je zapnut `document.addEventListener('click')`, který se uplatní na odchyt veškerých dalších kliků ven mimo interaktivní pole – postará se o automatické srolování filtru roletky a zavření řadicích nabídek předmětů.
