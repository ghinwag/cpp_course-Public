import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BreathCue, BreathingPebble } from '../components/BreathingPebble';
import { PressableScale } from '../components/PressableScale';
import { EASE_OUT_FN, colors } from '../lib/motion';

const SESSION_S = 180;

/** Three-minute calm session. Presented as a full-screen modal with a native fade (see _layout). */
export default function CalmScreen() {
  const [running, setRunning] = useState(true);
  const [left, setLeft] = useState(SESSION_S);
  const done = left === 0;

  // Once a second is fine on the RN runtime: this is a label, not motion.
  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, done]);

  // The one haptic of the session: the moment it completes.
  useEffect(() => {
    if (done) {
      setRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [done]);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.overline}>CALM SESSION</Text>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
          <Text style={styles.closeText}>Close</Text>
        </PressableScale>
      </View>

      <View style={styles.center}>
        <BreathingPebble running={running} />
        {done ? (
          <Animated.Text entering={FadeIn.duration(300).easing(EASE_OUT_FN)} style={styles.doneText}>
            Three minutes. Nicely done.
          </Animated.Text>
        ) : (
          <BreathCue running={running} />
        )}
      </View>

      <View style={styles.bottom}>
        <Text style={styles.timer} accessibilityLabel={`${mm} minutes ${ss} seconds left`}>
          {done ? 'Saved to tonight’s check-in' : `${mm}:${ss} left`}
        </Text>
        <PressableScale
          accessibilityRole="button"
          onPress={() => (done ? router.back() : setRunning((r) => !r))}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{done ? 'Done' : running ? 'Pause' : 'Resume'}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.plum, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 48 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { color: colors.rose, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  close: { minHeight: 44, justifyContent: 'center' },
  closeText: { color: '#FFFFFF', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  doneText: { color: '#FFFFFF', fontSize: 22, fontWeight: '500' },
  bottom: { alignItems: 'center', gap: 16 },
  timer: { color: '#C9C0CB', fontSize: 15, fontVariant: ['tabular-nums'] },
  button: { minWidth: 160, height: 52, borderRadius: 999, backgroundColor: colors.cherry, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
