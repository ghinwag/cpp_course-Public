# Pebl app: motion

Install (Expo resolves versions for your SDK):

    npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg expo-haptics expo-router

Requires Reanimated 4 and the New Architecture. Judge the feel in a release build on your slowest Android, not in Expo Go.

- `lib/motion.ts`: curves, breath timing (in 4s / out 6s), brand colours
- `components/PressableScale.tsx`: press feedback for every button and card
- `components/SymptomChip.tsx`: check-in chips with selection transition and haptic
- `components/BreathingPebble.tsx`: the breathing pebble, glow and synced "Breathe in / out" cue
- `app/calm.tsx`: the three-minute calm session
- `app/_layout.tsx`: native presentations for calm (fade), check-in (form sheet) and report

Deliberately not animated: the week-ahead forecast, the cycle chart, the hard-days switch and tab changes. They're seen many times a day, so motion would only slow them down.
