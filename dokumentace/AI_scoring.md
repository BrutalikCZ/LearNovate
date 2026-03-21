# Dokumentace: `AI/scoring.py`

Matematické srdce herní a motivační ekonomiky (Gamification) LearNovate se zrodilo formou skriptu `scoring.py`. Má oprávnění jako jeden z mála procesů přímo provádět I/O (Input/Output) manipulace v uživatelské databázi (`users.json`). 

*Tip: Stejně jako `logger.py` využívá knihovnu `filelock`, aby zabránil poškození paměti kontextovým přepínáním konkurenčních dotazů jiných webových klientů a samotného Node.js/PHP backendu, se kterým db může sdílet (v závislosti na celkové architektuře).*

## Ekonomika XP a Multiplikační stoly
Aby uživatelé, usilující o prvenství v Leaderboardech s přáteli a obstarávající si gamifikační pozitiva z herních metrik, "nefarmili" slepě stejný výukový scénář pořád dokola po dosažení paměťového optima, `scoring.py` zavádí obranný mechanismus zvaný de-multiplikátor z opakování.

Pokaždé, když endpoint aplikaci sdělí obstarání odhalení cvičení novým eventem (`start_scenario_run`), vytáhne tento proces z DB aktuální `repetitions` (jak moc uživatel na profil hrál tento konkrétní task) a určí z tabulky **`REPETITION_TABLE`** násobitel:
- **1. pokus:** Plná zátěž, 1.0 (100 %)
- **2. pokus:** Penála za ohranost 0.7 (70 %)
- **3. – 7. pokus:** Pouze poloviční zkušenosti za snahu (50 %)
- **8. a další:** Opět 1.0 (Skript usuzuje, že pokud hráč daný scénář pustí již osmé dny či týdny po sobě, slouží to jako aktivní rekapitulace z paměti pro testování, tudíž zvedá váhu odměny zpět.)

## Modifikace skóre postavy
Přes public metodu `award_milestone_points(user_id, scenario_id, milestone_index, milestone_points)` dojde k:
1. Vyhledání uživatele.
2. Získání `base_points` a vynásobení odpovídajícím multiplikátorem viz výše.
3. Bezpečné aktualizace celkového objemu zkušeností (`user["body"] += points_awarded`).
4. Uložení lokálního "high score" u profilu k danému předmětu (`best_milestones`). Skript vrátí souhrn upravených dat, které lze pak skrze HTTP payload posunout k uživateli do chatu před uživatele.
