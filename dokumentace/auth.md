# Dokumentace: `auth.js`

Tento modul zajišťuje obsluhu uživatelských účtů: přihlašování, registraci a správu relace (session/tokenů). Stará se také o aktualizaci vizuálního panelu uživatele (User Bar) s ukazateli dosažené úrovně a herních prvků (streaks, body).

## 1. Správa tokenů a stavu přihlášení
Modul ukládá autentizační token do `localStorage` prohlížeče pomocí funkcí `setToken`, `getToken` a `removeToken`.

Po načtení aplikace (`initAuth()`) se automaticky volá funkce `restoreSession()`, která se na základě existujícího tokenu dotáže endpointu `/api/auth/me` na data uživatele. Pokud je token platný, uživatel je přihlášen, jinak je odhlášen.

### `setLoggedIn(user, newlyUnlocked)`
Tato funkce zajistí naplnění globálního stavu `state.currentUser` daty a vykreslí v UI:
- Jméno uživatele
- Počet nasbíraných hvězdiček / XP
- Aktuální dosaženou úroveň (vypočítává se přes `getLevelInfo` ze skriptu `gamification.js`)
- Ohnivou ikonu nepřerušené série (tzv. "Streak"), pokud je větší než 0.
Zároveň dokáže zobrazit achievement toasty (vyskakovací notifikace úspěchů), pokud uživatel čerstvě získal nové bonusy.

## 2. Přihlášení a registrace
Přímo definuje funkce pro komunikaci s API pro formuláře:
- **`handleLogin()`**: Odesílá `email` a `password` na `/api/auth/login`. Následně skryje modální okno (pokud bylo login okno otevřené) a přihlásí uživatele aplikováním `setLoggedIn()`.
- **`handleRegister()`**: Analyzuje a validuje e-mail, heslo (minimálně 6 znaků) a potvrzení hesla, a komunikuje s `/api/auth/register`. 

Obě tyto funkce jsou pro snazší dostupnost z HTML na konci souboru vystaveny jako metody globálního objektu `window` (`window.handleLogin`, `window.handleRegister`). Klávesové zkratky pro potvrzení heslem pomocí `Enter` jsou ošetřeny uvnitř `initAuth()`.

## 3. Akce a interakce
Když je uživatel přihlášen, kliknutí na horní lištu spouští modální zobrazení komplexnějšího profilu přes `openProfileModal` (definováno v `gamification.js`). Kliknutí na navázané tlačítko odhlášení vyvolá metodu `setLoggedOut()`.
