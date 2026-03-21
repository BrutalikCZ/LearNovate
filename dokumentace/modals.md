# Dokumentace: `modals.js`

Tento soubor centralizuje logiku pro **zobrazování a skrývání modálních oken**, primárně spojených s autentizačním flow (přihlášení a registrace).

## Přehled funkcí
- **`showModal(type)`**: Otevře specifické vyskakovací okno na základě parametru `type` (např. `'login'` nebo `'register'`). Aktivní modál dostane CSS třídu `active`. Před otevřením vždy vyčistí případné chybové hlášky pomocí vnitřního volání `clearErrors()`.
- **`hideModals()`**: Zavře všechna autentizační modální okna odstraněním třídy `active`. Tuto funkci obvykle volají jiná tlačítka nebo globální handler stisku kláves.
- **`switchModal(type)`**: Obálka funkce `showModal(type)`, sloužící jako sémantické alias pro přepnutí např. z přihlášení na registraci přímo uvnitř zobrazeného modálu.
- **`showError(id, msg)`**: Bezpečná cesta pro injektáž a zobrazení specifické chyby (z `auth.js`) do konkrétního odstavce ve formuláři (zviditelní chybovou hlášku přidáním CSS třídy `visible`).
- **`initModals()`**: Inicializační metoda, definuje globální chování:
  - Uzavře dialogy, pokud uživatel klikne do potemnělé plachty (tzv. "backdrop" kolem samotného okénka).
  - Přiřazuje posluchač stisku klávesnice. Pokud je stisknuta klávesa **Escape**, dojde ke skrytí všech okének (login, registrace, ale také herní profily a žebříčky z `gamification.js`).
