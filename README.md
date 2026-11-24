# Korbi's Roulette Logging

A simple Android app (German / English) for logging roulette numbers in a
**rolling pool** ("Stammzahlen"), plus statistics. For educational purposes.

## How the pool works

- At the start you pick the pool size: **24** by default, adjustable from 1 to 36.
- Tap the number that fell (0–36):
  - **New number** → goes to slot 1 (top). If the pool is full, the number in the
    last slot (the one that hasn't come for the longest time) **drops out**.
  - **Number already in the pool** → jumps to slot 1. Nothing drops out.
- The last slot has a red border: that number drops out next.
- Gold-framed keys = numbers that are currently in the pool.

## Features

- Sessions: start, end, continue, rename, delete. Everything is saved automatically.
- **Practice mode**: a session that does not count towards the overall stats
  (can also be switched on/off later).
- Stats per session and overall: pool hit rate vs. pure chance, law of the third,
  hot/cold numbers, sleepers, red/black/zero, even/odd, 1–18/19–36, dozens,
  columns, wheel sectors (Voisins/Tiers/Orphelins), streaks, longest absence,
  wheel view, frequency of all 37 numbers, history (tap a spin to delete it).
- **Read aloud**: the pool numbers are read from slot 1 to the last, over and over, in the
  app language, with 5 speeds. Toggle with the "Vorlesen" button on the play screen.
- **Voice input** (German and English): tap "Sprechen" and say the number. Also understands
  "rückgängig"/"undo", "lösch die 17", "falsch, 17", "vorlesen", "stopp", "hilfe".
  Optional hands-free mode. The app never listens while it is speaking.
- **Number keys like the casino table**: 3 rows (3 6 9 … / 2 5 8 … / 1 4 7 …) with 0 on the
  left, or big buttons with 6 per row.
- **Sort the pool 0–36** with one tap ("Newest | 0–36") – only the view changes.
- **Smart neighbours** ("17 mit Nachbarn", 2·2): spots when 5 pool numbers sit side by side on
  the wheel, shows the call to announce and what is left as single numbers; each call gets its
  own colour in the pool. Statistics show how often the wheel areas of the hottest numbers were hit.
- Built-in guide ("So funktioniert's") and an explanation of the two-thirds law.
- Responsible-gambling help page (free German helpline, check-dein-spiel.de, OASIS self-exclusion).
- Portrait (default), landscape or automatic screen orientation.
- Large, easy-to-read controls, text size setting, vibration, screen stays on.

## Development

Requirements: Node ≥ 20.19, pnpm, JDK 17, Android SDK (`ANDROID_HOME` or `android/local.properties`).

```bash
pnpm install
pnpm dev          # run in the browser
pnpm test         # unit tests
pnpm apk          # build signed release APK → dist-apk/KorbisRoulette-vX.Y.Z.apk
pnpm apk:install  # install on a connected phone / emulator via adb
```

## Versioning & releases

- [SemVer](https://semver.org): the version in `package.json` is the only source of truth.
  - **patch** (1.0.**1**): bug fixes · **minor** (1.**1**.0): new features · **major** (**2**.0.0): big changes
- Android `versionCode` = `MAJOR*10000 + MINOR*100 + PATCH` (1.2.3 → 10203), computed automatically.
- `pnpm release patch|minor|major` → runs the tests, bumps the version, commits, tags `vX.Y.Z` and pushes.
  The tag triggers GitHub Actions, which builds the signed APK and attaches it to a **GitHub Release**.

### Signing

Release APKs must always be signed with the **same key**, otherwise Android refuses
to install an update over an older version.

- Local: `android/korbis-release.jks` + `android/keystore.properties` (both gitignored).
  **Back up both files somewhere safe.**
- CI: GitHub secrets `KR_KEYSTORE_BASE64`, `KR_KEYSTORE_PASSWORD`, `KR_KEY_ALIAS`, `KR_KEY_PASSWORD`.
- Without a key the build falls back to the debug key (still installs, but can't update a release build).

## App icon

Replace the placeholders in `assets/` with your own designs (PNG, sRGB):

| File | Size | Content |
| --- | --- | --- |
| `assets/icon-only.png` | 1024×1024 | full icon (legacy / round icons) |
| `assets/icon-foreground.png` | 1024×1024, **transparent** | motif for the adaptive icon; keep anything important inside the centre circle of ~660 px diameter (the edges get cropped) |
| `assets/icon-background.png` | 1024×1024 | background layer (solid colour or pattern) |
| `assets/splash.png` / `splash-dark.png` | 2732×2732 | splash screen, motif in the centre ~1200 px |

Then run `pnpm icons` and `pnpm apk`. The SVG sources of the placeholders are in `assets/src/`.

---

*Every spin is independent. No statistic can predict the next number. Please play responsibly.*
