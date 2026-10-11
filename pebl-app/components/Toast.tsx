import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { EASE_OUT_FN, colors } from '../lib/motion';
import { fonts } from '../lib/theme';

/**
 * A small "Logged" pill. Seen many times a day, so it's a quick fade only, no movement.
 * Call show() each time; repeated calls restart the timer instead of stacking.
 */
export function useToast(durationMs = 1400) {
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    setKey((k) => k + 1);
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMessage(null), durationMs);
  };

  const node = message ? (
    <Animated.View
      key={key}
      entering={FadeIn.duration(120).easing(EASE_OUT_FN)}
      exiting={FadeOut.duration(200)}
      style={styles.toast}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  ) : null;

  return { show, node };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.pearl,
    zIndex: 10,
  },
  text: { color: colors.black, fontFamily: fonts.semibold, fontSize: 15 },
});
