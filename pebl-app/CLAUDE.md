# Pebl app: rules for every session

Pebl is a pocket pebble plus a private app for people whose PMS changes their week. Press to log a moment, hold to calm down; the app shows your pattern over a cycle. This v0 is phone-only (an on-screen pebble stands in for the device) and exists for a one-cycle carry test with 10–15 people: do they keep logging in week 4, and what do they log?

The owner is a beginner. Explain each step in one or two plain sentences, say exactly what to type when you need them, and check things work before moving on.

Also read `AGENTS.md` (Expo commands; Expo APIs change every SDK, so check the installed types or versioned docs, not memory).

## Product rules
- **Wellness wording only.** Never say the app diagnoses, treats, predicts or manages PMS or PMDD. "Notice your pattern", not "medical insight".
- **Not yet:** no Bluetooth, accounts, cloud sync, analytics SDKs, AI, forecasting or predictions. Pattern describes the past only.
- **Private:** everything stays on the phone in expo-sqlite (`lib/db.ts`). Data only leaves through the user's own CSV export.
- **Reliable and simple** beats clever. Testers must be able to log in two seconds.
- **Accessible:** touch targets ≥ 48pt (`TAP` in `lib/theme.ts`), `accessibilityLabel`/`Role` on every control, `minHeight` not fixed `height` on anything with text so large text sizes work.

## Data
- Tables: `events` (id, timestamp UTC ISO, local_date, type = tap | calm | checkin, cycle_day, tags JSON array, rating 1–5 = Easy…Awful, note), `cycles` (start_date), `settings` (key/value).
- Schema changes go through `migrate()` in `lib/db.ts` with a new `PRAGMA user_version` step. Never drop testers' data.
- Every write calls `dataChanged()`; screens reload via `useDataVersion()`.
- CSV export (`lib/csv.ts`): one row per event plus a `tester` (nickname) column so files merge. Don't rename or reorder columns mid-test.
- Cycle day = days since the latest period start on/before that date, +1. Changing period dates recomputes stored `cycle_day`.

## Brand
- Dark, Apple-like, calm. Colours (`lib/motion.ts` → `colors`, surfaces in `lib/theme.ts` → `ui`): black #000000, ink #1C1C1E, pearl #F5F5F7, rose #F2C3CD, rose text #A0465B, cherry #8E1B33.
- Fonts (`fonts` in `lib/theme.ts`): Geist for UI, Geist Mono for numbers, Bricolage Grotesque Bold **only** for the "pebl." wordmark (`<Wordmark />`). With custom fonts, set `fontFamily`, not `fontWeight`.

## Motion (follow `lib/motion.ts`)
- Press feedback on press-in (`PressableScale`), commit on release.
- Springs for anything touched (the pebble). Never ease-in on UI.
- `cubicBezier` curves are for CSS transitions/animations only; layout animations and `withTiming` use `EASE_OUT_FN` / `settleIn()`.
- Nothing animated that people see dozens of times a day: no tab transitions (`animation: 'none'`), no chart animation, the "Logged" toast only fades.
- Native presentations for screens (form sheets, full-screen fade). Never a JS-built screen transition.
- Respect Reduce Motion (`useReducedMotion`): drop movement, keep a gentle opacity change.
- Use `sharedValue.set()` (not `.value =`) in handlers so lint stays clean.

## Workflow
- Install packages with `npx expo install <pkg>` (SDK-matched versions). Must run in Expo Go: no custom native modules without telling the owner a development build is needed.
- Before saying anything is done: `npx tsc --noEmit`, `npx expo lint`, `npm test` (pure logic in `lib/dates.ts`, `lib/pattern.ts`, `lib/csv.ts` has unit tests; add tests when you change them).
- After each screen or fix: run it, fix errors, and tell the owner what to try on their phone.
- Commit after each working step with a clear message, so it's easy to undo.
- `npx expo start --web` gives a browser preview (expo-sqlite works there via `metro.config.js`); reminders are phone-only.
