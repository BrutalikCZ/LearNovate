# Dokumentace: `gamification.js`

Tento centrální modul zajišťuje **gamifikaci a veškerou s ní spojenou vizuální reprezentaci**. Obsahuje definice úrovní postav a získatelných milníků (odměn / achievementů). Dále zabezpečuje vizualizaci postupu uživatele v aplikaci, včetně animací, vyskakovacích oken a žebříčku nejlepších hráčů.

## 1. Herní definice a výpočty
V úvodu souboru nalezneme klíčové konstanty:
- **`LEVELS`**: Pole objektů definující názvy 12 úrovní (Nováček, Zvědavec ... Nesmrtelný) a hraniční body zkušeností (XP) potřebné pro jejich dosažení.
- **`ACHIEVEMENTS`**: Pole definující dostupné herní odznaky. Každý má své unikátní ID (např. 'first_scenario', 'streak_3'), jméno, barvu a spárovanou Lucide ikonu.

K těmto datům se přistupuje pomocí:
- **`getLevelInfo(xp)`**: Přejímá absolutní číslo nasbíraných XP a dynamicky z něj vrací kompozitní objekt:
  - Informace o aktuálním a následujícím levelu.
  - `progress`: Procentuální vyjádření posunu do další úrovně.
  - `xpNeeded`: Kolik zadaných zkušeností chybí do levelu dalšího.

## 2. Animace a upozornění (Toasty)
Když uživatel získá body prostřednictvím modulu router (interakcí s AI s asistentem) a volá se zpět modul autentizace, volávají se vizuální odezvy z tohoto souboru:
- **`showXpFloat(points, anchorEl)`**: Vytvoří plovoucí, vzhůru letící (a mizející) text počtu zrovna získaných hvězdiček, který vyběhne ze zvoleného DOM elementu na obrazovce.
- **`launchConfetti()`**: Komplexní funkce, která nageneruje padající různobarevné puntíky po dohrání celého výukového scénáře na plný počet prvků (tzv. "perfect run").
- **`showLevelUpBanner(levelInfo, container)`**: Vloží na chvíli do chatu grafický proužek informující uživatele, že právě povýšil na novou prestižní úroveň.
- **`showAchievementToast(achievementId)`**: Dočasný "toast" notifikační prvek, který vjede na obrazovku zespoda a oznámí zisk konkrétní odměny.

## 3. Komplexní modální okna
Ačkoliv samotnou logiku okna drží v aplikaci `modals.js`, tento soubor plní obsah specifických gamifikačních oken přes vnitřní promítání HTML a CSS tříd:
- **`openProfileModal(user)`**: Sestaví široký detail postavy: Vypíše nasbírané skóre, aktuální "dní v řadě" (steak), vypočítá tloušťku progress baru (XP lišty) a vykreslí barevnou nebo zašedlou mřížku odznaků.
- **`openLeaderboardModal()`**: Vyžádá si data přes fetchnutí backend API na `/api/gamification/leaderboard`, obarví pole a vykreslí tabulku uživatelů se zobrazenou aktuální pozicí. Třem nejlepším hráčům přiřadí grafické ikony medailí ('🥇', '🥈', '🥉').
