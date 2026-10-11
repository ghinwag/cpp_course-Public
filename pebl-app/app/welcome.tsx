import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '../components/PressableScale';
import { DatePicker } from '../components/DatePicker';
import { Stepper } from '../components/Stepper';
import { SymptomChip } from '../components/SymptomChip';
import { Wordmark } from '../components/ui';
import { EASE_OUT, EASE_OUT_FN, colors, settleIn } from '../lib/motion';
import { fonts, ui } from '../lib/theme';
import { saveSettings, setLatestPeriodStart } from '../lib/db';
import { parseLocal } from '../lib/dates';

/**
 * First-run setup: a hello, then three short questions.
 * Seen once per device, so it is allowed a little delight.
 * Steps advance on a button, not a swipe, so every change is state-driven:
 * CSS transitions and layout animations, no shared values, nothing on the JS thread per frame.
 */

const STEPS = [
  {
    title: 'Hello, Pebl.',
    body: 'Press the pebble to log a moment. Hold it to calm down. Over one cycle, Pebl shows you your pattern.',
  },
  { title: 'When did your last period start?', body: 'The first day. Your best guess is fine.' },
  { title: 'How long is your cycle, usually?', body: 'From the first day of one period to the next.' },
  { title: 'What should we call you?', body: 'Optional. It is added to your exported file so it can be told apart from others.' },
] as const;

export default function Welcome() {
  const db = useSQLiteContext();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [lastStart, setLastStart] = useState<string | null>(null);
  const [length, setLength] = useState(28);
  const [unsure, setUnsure] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const canContinue = step !== 1 || lastStart !== null;

  const next = async () => {
    if (!last) return setStep((n) => n + 1);
    if (!lastStart || saving) return;
    setSaving(true);
    await setLatestPeriodStart(db, lastStart);
    await saveSettings(db, { nickname, cycleLength: unsure ? null : length, onboarded: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/today');
  };

  // Entering content: settle up from 12px below; reduced motion keeps only the fade.
  const enter = reduced ? FadeIn.duration(200) : settleIn(320);
  const exit = FadeOut.duration(160);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          {step > 0 ? (
            <PressableScale onPress={() => setStep((n) => n - 1)} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
              <Text style={styles.backText}>Back</Text>
            </PressableScale>
          ) : (
            <Wordmark size={26} />
          )}
        </View>

        {step === 0 ? (
          <View style={styles.stage}>
            <Animated.View entering={enter} exiting={exit} style={StyleSheet.absoluteFill}>
              <Image
                source={require('../assets/renders/Pebl-hero.png')}
                style={styles.img}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
                accessibilityLabel="The Pebl pebble"
              />
            </Animated.View>
          </View>
        ) : null}

        <ScrollView style={step === 0 ? undefined : styles.flex} contentContainerStyle={styles.copyScroll} keyboardShouldPersistTaps="handled">
          <Animated.View key={`t${step}`} entering={reduced ? FadeIn.duration(200) : FadeIn.duration(260).delay(60).easing(EASE_OUT_FN)} style={styles.copy}>
            <Text style={styles.title} accessibilityRole="header">
              {s.title}
            </Text>
            <Text style={styles.body}>{s.body}</Text>
          </Animated.View>

          {step === 1 && (
            <View style={styles.field}>
              <DatePicker value={lastStart} onChange={setLastStart} />
              <Text style={styles.picked} accessibilityLiveRegion="polite">
                {lastStart ? parseLocal(lastStart).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Tap a day'}
              </Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.field}>
              <View style={{ opacity: unsure ? 0.35 : 1 }} pointerEvents={unsure ? 'none' : 'auto'}>
                <Stepper value={length} onChange={setLength} min={18} max={45} unit="days" label="Cycle length" />
              </View>
              <View style={styles.row}>
                <SymptomChip label="Not sure" selected={unsure} onToggle={() => setUnsure((u) => !u)} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.field}>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Nickname (optional)"
                placeholderTextColor={ui.faint}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={32}
                returnKeyType="done"
                accessibilityLabel="Nickname, optional"
              />
              <Text style={styles.privacy}>Everything you log stays on this phone. No account, no cloud.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.dots} accessibilityRole="progressbar" accessibilityLabel="Setup progress" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}>
          {STEPS.map((_, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: i === step ? 1 : 0.3, transitionProperty: 'opacity', transitionDuration: 180, transitionTimingFunction: EASE_OUT }]}
            />
          ))}
        </View>

        <PressableScale
          onPress={next}
          disabled={!canContinue || saving}
          style={[styles.cta, (!canContinue || saving) && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue || saving }}
        >
          <Text style={styles.ctaText}>{last ? (nickname.trim() ? 'Start' : 'Skip and start') : step === 0 ? 'Set up' : 'Next'}</Text>
        </PressableScale>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  flex: { flex: 1 },
  topRow: { minHeight: 48, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'flex-start' },
  back: { minHeight: 48, justifyContent: 'center' },
  backText: { color: ui.text, fontSize: 17, fontFamily: fonts.regular },
  stage: { flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0B0B0D' },
  img: { width: '100%', height: '100%' },
  copyScroll: { paddingHorizontal: 20, gap: 20, paddingBottom: 20 },
  copy: { gap: 8 },
  title: { color: colors.pearl, fontSize: 30, fontFamily: fonts.semibold, letterSpacing: -0.8 },
  body: { color: ui.muted, fontSize: 16, lineHeight: 22, fontFamily: fonts.regular },
  field: { gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  picked: { color: ui.accent, fontSize: 16, fontFamily: fonts.medium, textAlign: 'center' },
  input: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: ui.card,
    color: ui.text,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: fonts.regular,
  },
  privacy: { color: ui.faint, fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center', paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pearl },
  cta: { minHeight: 54, marginHorizontal: 20, marginBottom: 12, borderRadius: 999, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  ctaText: { color: '#000', fontSize: 17, fontFamily: fonts.semibold },
});
