# Changelog

## 1.6.0 – 2026-11-24

- **Smart neighbours ("17 mit Nachbarn")**: the app now spots when 5 numbers of your pool sit
  side by side on the wheel and shows the call you can simply announce at the table –
  e.g. "17 mit Nachbarn" instead of 2, 25, 17, 34 and 6 one by one.
  - Always the casino standard 2·2 (two left, two right). The old left/right/count settings
    are gone.
  - Strip above the keypad: the numbers to announce, plus how many are left as single numbers.
    Tap it for the full list: every call with its 5 numbers, the singles, and the total
    number of chips.
  - Each call has its own colour – a coloured bar under the pool boxes it covers, and a ★ on
    the number you announce.
  - Calls never overlap and never include a number that is not in your pool.
  - Switched on for everyone once with this update; turn it off under Settings → Neighbours,
    in the session menu or by voice ("Nachbarn aus").
- Guide ("So funktioniert's") has a new step explaining sorting and neighbours, and mentions
  that the keys are laid out like the table.
- Fix: percentages and decimals in the statistics use a decimal comma in German (22,2 %).
- Fix: settings card for neighbours no longer repeats its title.

## 1.5.0 – 2026-11-24

- **Sort the pool 0–36**: new switch "Newest | 0–36" right on the pool. "0–36" shows your
  numbers in order, so you find a number at a glance and can place bets one after another
  on the table. Switch back any time – nothing about the pool changes, only the view.
  - The small number in each box still shows the slot (1 = newest), the newest number keeps
    its gold frame and the one that drops out next keeps its red frame.
  - Read aloud follows the order on screen.
  - Voice: "sortieren" / "sort" and "sortieren aus" / "unsortiert" / "sort off".

## 1.4.0 – 2026-11-24

- **Number keys "like the table" (new default)**: the keypad now looks like a real roulette
  table – 0 on the left over three rows, then 3 6 9 … 36 on top, 2 5 … 35 in the middle and
  1 4 … 34 at the bottom. The old big buttons (6 per row) are still there:
  Settings → "Number keys" or the session menu.
- In landscape the table keypad uses the full width under the pool, so the keys are wide.
  The pool switches to 12 per row there.
- Removed a 7 MB bug-report file that had been committed to the repository by mistake.

## 1.3.0 – 2026-11-19

- **Bigger, clearer app icon**: the roulette wheel now fills the whole icon with a large
  "Korbi's" in the middle (before it was shrunk to about a third of the icon).
  Icon layers are rendered at full resolution for every screen density, so it stays sharp.
- Neighbour mode: neighbours that are currently in the pool get the same gold frame and dot
  as on the keypad (also in the statistics).
- `pnpm icons` now automatically removes the extra icon padding that @capacitor/assets adds.

## 1.2.0 – 2026-11-19

- **Neighbour mode ("Nachbarn")**: shows the hottest number(s) of the session with their
  neighbours on the wheel, e.g. 2·2 = two left, two right (17 → 2 25 **17** 34 6).
  Left and right set separately (0–4), quick choice 1·1 … 4·4, 1–6 hot numbers.
  Strip above the keypad; toggle in the session menu, settings or by voice ("Nachbarn").
- Statistics: hot numbers with neighbours and how often that wheel area was hit vs. chance.
- **"How it works" guide** (opens once on first start, available any time) and
  **"What is this app for?"** page explaining the two-thirds law (law of the third).
- **Responsible gambling**: help page with warning signs, tips, the free German helpline
  0800 1 37 27 00 (tap to call), check-dein-spiel.de, Gamblers Anonymous and OASIS
  self-exclusion; short note on the start and settings screens.
- Fix: "Continue" on the start screen now picks the most recently used session.

## 1.1.0 – 2026-11-19

- **Read aloud**: reads the pool numbers from slot 1 to the last one in an endless loop,
  in the app language. Toggle on the play screen ("Vorlesen"), in the session menu or in
  the settings. The slot being read is highlighted. 5 speeds (very slow … very fast).
- **Voice input** (German + English, mixed freely): microphone button on the play screen.
  Understands numbers as digits or words ("siebzehn", "twenty one", "einundzwanzig", "zwo"),
  several numbers at once, "rückgängig"/"undo", "lösch die 17", "falsch, 17" (correct the
  last number), "vorlesen"/"vorlesen aus", "stopp", "hilfe". Shows and says what it understood.
- Hands-free mode: keeps listening after every number.
- **Screen orientation** setting: portrait (default), landscape, automatic.
  New landscape layout: pool left, big keypad right, tabs on the side.
- Clear hint when the phone has no voice installed for the language.
- Fixes: white strip next to the camera cutout in landscape, history "more" button label.

## 1.0.0 – 2026-11-19

- First version: rolling number pool (default 24), keypad 0–36 with undo
- Sessions: start / end / continue / rename / delete, autosave
- Practice mode (not counted in overall stats)
- Session and overall statistics, wheel view, history
- German and English, text size, vibration, screen stays on
- Placeholder app icon and splash screen
