import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { BREATH_MS, EASE_IN_OUT, INHALE_PCT, colors } from '../lib/motion';
import { fonts } from '../lib/theme';

const PEBBLE_PATH =
  'M104 28 C140 26 164 50 162 82 C160 116 128 134 96 132 C62 130 38 110 40 80 C42 50 68 30 104 28 Z';

type Props = {
  /** Pauses on the current frame instead of snapping back, so stopping never jolts. */
  running: boolean;
  size?: number;
};

/**
 * The in-app calm session: Pebl breathes with you, in for 4s, out for 6s,
 * the same rhythm as the device's haptic pulse.
 *
 * A loop with no state change and no finger on it, so CSS keyframes:
 * the whole thing runs on the UI thread and React never re-renders per frame.
 */
export function BreathingPebble({ running, size = 240 }: Props) {
  const reduced = useReducedMotion();
  const loop = {
    animationDuration: BREATH_MS,
    animationIterationCount: 'infinite' as const,
    animationTimingFunction: EASE_IN_OUT,
    animationPlayState: running ? ('running' as const) : ('paused' as const),
  };

  // Reduced motion: keep the light (it explains the rhythm), drop the movement.
  const pebbleKeyframes = reduced
    ? { '0%': { opacity: 0.85 }, [INHALE_PCT]: { opacity: 1 }, '100%': { opacity: 0.85 } }
    : {
        '0%': { transform: [{ scale: 0.94 }] },
        [INHALE_PCT]: { transform: [{ scale: 1.04 }] },
        '100%': { transform: [{ scale: 0.94 }] },
      };

  const glowKeyframes = reduced
    ? { '0%': { opacity: 0.3 }, [INHALE_PCT]: { opacity: 0.9 }, '100%': { opacity: 0.3 } }
    : {
        '0%': { opacity: 0.3, transform: [{ scale: 0.85 }] },
        [INHALE_PCT]: { opacity: 0.9, transform: [{ scale: 1.1 }] },
        '100%': { opacity: 0.3, transform: [{ scale: 0.85 }] },
      };

  const glowSize = size * 1.5;

  return (
    <View
      style={[styles.stage, { width: glowSize, height: glowSize }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Breathing guide. Breathe in for four seconds, out for six."
    >
      {/* Glow: its own layer, animated by opacity and transform only. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { animationName: glowKeyframes, ...loop }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFF3F6" stopOpacity={1} />
              <Stop offset="45%" stopColor={colors.rose} stopOpacity={0.8} />
              <Stop offset="100%" stopColor={colors.rose} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="50" rx="50" ry="50" fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{ width: size, height: size * 0.8, animationName: pebbleKeyframes, ...loop }}>
        <Svg width="100%" height="100%" viewBox="0 0 200 160">
          <Defs>
            <RadialGradient id="stone" cx="40%" cy="35%" r="70%">
              <Stop offset="0%" stopColor="#FFF3F6" />
              <Stop offset="42%" stopColor={colors.rose} />
              <Stop offset="100%" stopColor={colors.roseDeep} />
            </RadialGradient>
          </Defs>
          <Path d={PEBBLE_PATH} fill="url(#stone)" />
          <Ellipse cx="98" cy="70" rx="28" ry="23" fill="#000000" fillOpacity={0.08} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * "Breathe in" / "Breathe out", crossfaded on the same 10s clock as the pebble,
 * so the words can never drift out of sync with the motion.
 */
export function BreathCue({ running }: { running: boolean }) {
  const loop = {
    animationDuration: BREATH_MS,
    animationIterationCount: 'infinite' as const,
    animationTimingFunction: 'linear' as const,
    animationPlayState: running ? ('running' as const) : ('paused' as const),
  };
  const inKeyframes = { '0%': { opacity: 1 }, '37%': { opacity: 1 }, '43%': { opacity: 0 }, '97%': { opacity: 0 }, '100%': { opacity: 1 } };
  const outKeyframes = { '0%': { opacity: 0 }, '37%': { opacity: 0 }, '43%': { opacity: 1 }, '97%': { opacity: 1 }, '100%': { opacity: 0 } };

  return (
    <View style={styles.cue} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Text style={[styles.cueText, { animationName: inKeyframes, ...loop }]}>Breathe in</Animated.Text>
      <Animated.Text style={[styles.cueText, styles.cueOverlay, { animationName: outKeyframes, ...loop }]}>
        Breathe out
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  cue: { minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  cueText: { color: '#FFFFFF', fontSize: 22, fontFamily: fonts.medium, letterSpacing: -0.4 },
  cueOverlay: { position: 'absolute' },
});
