# Getting Pebl onto testers' phones

**Why not an Expo Go link?** Since May 2026, Expo Go only opens published projects for people who are members of your Expo account or organisation. Expo Go is still the quickest way to try it on *your* phone. For 10–15 outside testers, use real test builds: **TestFlight** for iPhone and an **install link (APK)** for Android. Both are built in the cloud by EAS, so you don't need Xcode or Android Studio.

## You do this once

1. Make a free account at expo.dev, then in the `pebl-app` folder:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init        # links the project to your account
   ```
2. **iPhone testers:** join the Apple Developer Program ($99/year, approval can take a day or two). In `app.json`, change `app.pebl.carrytest` to an ID you own, e.g. `com.yourname.pebl`. Then:
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest submit --platform ios --latest
   ```
   The first build asks you to sign in to Apple and creates the certificates for you. After upload, in **App Store Connect → TestFlight**, fill in "Test information", create an **External testing** group, add testers' emails (or turn on a public link). The first external build gets a short Apple review (usually under a day).
3. **Android testers:**
   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```
   When it finishes you get a link and QR code to an `.apk`. Share that link.
4. Before sending, install it yourself and run the 2-minute check below.

## Each tester does this

1. **iPhone:** install **TestFlight** from the App Store, open your invite email or public link, tap **Install**. **Android:** open your link, download the APK, allow "install unknown apps" for the browser when asked, tap **Install**.
2. Open Pebl and do the setup: the first day of your last period, your usual cycle length (or "Not sure"), and the **nickname you were given** (e.g. "T07"). It goes in your export.
3. Settings → turn on the **evening reminder** and allow notifications.
4. Every day: **tap the pebble** whenever something comes up (add tags if you like, or skip). **Hold it** when you want to calm down. Answer the evening check-in if you feel like it. Skipping is fine.
5. When your period starts: **Today → "Period started today?"** (or Settings → Log a period).
6. At the end of the cycle: **Settings → Export my data (CSV)** and send the file to you (Mail, WhatsApp, AirDrop…).
7. Don't delete the app until you've exported. Deleting the app deletes the data.

## 2-minute check before you send it out

- Set up → tap the pebble → pick a tag → Done → "1 tap today" shows.
- Hold the pebble → calm session opens → Close.
- Evening check-in → pick "Okay" → Save → "Today felt okay".
- History shows today. Settings → Export opens the share sheet with a CSV.
- Settings → Delete all my data → confirm → back to setup.

## Updating the app mid-test

Fix, then rebuild with the same commands (`eas build` + `eas submit` for iOS). TestFlight testers get the update in TestFlight, and Android testers install the new APK over the old one. Data is kept in both cases as long as the app ID in `app.json` doesn't change.
