# Dokumentace: `theme.js`

Mikromodul sloužící k **přepínání globálního vzhledu mezi světlým a tmavým režimem** (Dark mode / Light mode).

## Funkčnost a inicializace

- Při zavolání funkce **`initTheme()`** (`app.js`) modul nejdříve aplikuje aktuální režim zvolený v paměti přes HTML atribut `data-theme`. Tímto způsobem získá vliv na kořenové CSS proměnné, které v celém systému ovlivňují barvy.
- Dále dojde k zavolání interní funkce `updateThemeIcon()`, která dle stavu vybírá `lucide` ikonku:
  - `sun` pro světlý režim
  - `moon` pro tmavý režim
- Stejná funkce (`initTheme`) připojí interakci na tlačítko označené ID `#themeBtn` (většinou umístěné v postranním panelu nebo headeru aplikace), a při kliknutí provede funkci `toggleTheme()`.
- **`toggleTheme()`**: Nastaví proměnnou a updatuje `localStorage['theme']`. Nakopíruje ji do DOM atributu `data-theme`, aby mohlo CSS okamžitě reagovat.
