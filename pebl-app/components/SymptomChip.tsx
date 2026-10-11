import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PressableScale } from './PressableScale';
import { EASE_OUT, colors } from '../lib/motion';
import { fonts } from '../lib/theme';

type Props = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  /** Category colour when selected: mood, body or skin. */
  tint?: string;
};

/**
 * Tag chip (quick tags, check-in, setup). Selection is a state indication tapped a handful of times a day,
 * so it gets a short colour transition (180ms) plus one selection haptic on commit.
 */
export function SymptomChip({ label, selected, onToggle, tint = colors.roseText }: Props) {
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? tint : '#2C2C2E',
            borderColor: selected ? tint : '#3A3A3C',
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: 180,
            transitionTimingFunction: EASE_OUT,
          },
        ]}
      >
        <Text style={[styles.label, { color: selected ? '#FFFFFF' : colors.pearl }]}>{label}</Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontFamily: fonts.medium },
});
