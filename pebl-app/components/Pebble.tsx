import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../lib/motion';

// Same stone as BreathingPebble, so the calm screen feels like the same object.
const PEBBLE_PATH =
  'M104 28 C140 26 164 50 162 82 C160 116 128 134 96 132 C62 130 38 110 40 80 C42 50 68 30 104 28 Z';

// Touched, so it springs. Quick to sink, a little give on the way back.
const PRESS_SPRING = { damping: 18, stiffness: 420, mass: 0.6 };
const RELEASE_SPRING = { damping: 12, stiffness: 260, mass: 0.6 };

type Props = {
  onTap: () => void;
  onHold: () => void;
  size?: number;
};

/**
 * The on-screen stand-in for the physical pebble.
 * Press feedback starts on press-in; the tap commits on release with one haptic.
 * Holding for half a second opens the calm session instead.
 * Reduce Motion: no scaling, just a brief dim.
 */
export function Pebble({ onTap, onHold, size = 280 }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: dim.value }));

  return (
    <Pressable
      onPressIn={() => {
        if (reduced) dim.set(withTiming(0.75, { duration: 80 }));
        else scale.set(withSpring(0.93, PRESS_SPRING));
      }}
      onPressOut={() => {
        if (reduced) dim.set(withTiming(1, { duration: 120 }));
        else scale.set(withSpring(1, RELEASE_SPRING));
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onTap();
      }}
      delayLongPress={500}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onHold();
      }}
      accessibilityRole="button"
      accessibilityLabel="Pebble"
      accessibilityHint="Tap to log a moment. Hold to start a calm session."
      accessibilityActions={[{ name: 'activate' }, { name: 'longpress', label: 'Start a calm session' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'longpress' ? onHold() : onTap())}
      style={styles.hit}
    >
      <Animated.View style={[{ width: size, height: size * 0.8 }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 160">
          <Defs>
            <RadialGradient id="tapStone" cx="40%" cy="35%" r="70%">
              <Stop offset="0%" stopColor="#FFF3F6" />
              <Stop offset="42%" stopColor={colors.rose} />
              <Stop offset="100%" stopColor={colors.roseDeep} />
            </RadialGradient>
          </Defs>
          <Path d={PEBBLE_PATH} fill="url(#tapStone)" />
          {/* The scoop: where your thumb goes on the real thing. */}
          <Ellipse cx="98" cy="70" rx="28" ry="23" fill="#000000" fillOpacity={0.08} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { alignItems: 'center', justifyContent: 'center' },
});
