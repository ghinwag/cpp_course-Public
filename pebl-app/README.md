# Pebl app v0 (carry-test companion)

A phone-only first version of Pebl for a one-cycle test with 10–15 people. Tap the big pebble to log a moment, hold it to calm down, check in in the evening, and see your pattern after one cycle. Everything stays on the phone; each tester can export a CSV.

Expo SDK 57 · Expo Router · TypeScript · expo-sqlite. Runs in Expo Go.

## Run it on your phone

1. Install **Expo Go** from the App Store / Play Store (the current version supports SDK 57).
2. In a terminal, inside this `pebl-app` folder:

   ```bash
   npm install
   npx expo start
   ```

3. A QR code appears. **iPhone:** scan it with the Camera app. **Android:** scan it from inside Expo Go.
4. Phone and computer must be on the same Wi-Fi. If it won't connect (office or hotel Wi-Fi), stop it with `Ctrl+C` and run `npx expo start --tunnel` instead.

Preview on your computer: `npx expo start --web` (reminders only work on the phone).

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint
npm test           # cycle maths, pattern and CSV tests
```

## What's where

- `app/welcome.tsx` setup (period date, cycle length, nickname) · `app/(tabs)/today.tsx` the pebble · `app/tag.tsx` quick tags · `app/checkin.tsx` evening check-in · `app/calm.tsx` calm session · `app/(tabs)/history.tsx`, `pattern.tsx`, `settings.tsx`
- `lib/db.ts` SQLite tables and queries · `lib/dates.ts` cycle maths · `lib/pattern.ts` pattern maths · `lib/csv.ts` export format · `lib/reminders.ts` daily reminder
- `lib/motion.ts` curves, breathing timing, brand colours · `lib/theme.ts` fonts and surfaces
- `components/` PressableScale, SymptomChip, BreathingPebble, Pebble, and small UI pieces

Motion was designed for a release build: judge the final feel in a TestFlight / APK build on a slow Android, not only in Expo Go.

## CSV columns

`tester, event_id, timestamp_utc, local_date, type, cycle_day, days_before_next_period, tags, rating, rating_label, note`

One row per event. `type` is `tap`, `calm` or `checkin`. `tags` are separated by `|`. `rating` 1–5 = Easy, Okay, Meh, Hard, Awful. `days_before_next_period` is filled once the next period is logged. Merge testers' files by stacking rows; the `tester` column tells them apart.

## Getting it onto testers' phones

Since May 2026, Expo Go only opens published projects for people in your Expo account or organisation, so outside testers need a real test build. Use TestFlight for iPhone and an install link for Android. See `TESTERS.md`.
