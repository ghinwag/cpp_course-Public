import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PressableScale } from './PressableScale';
import { fonts, ui } from '../lib/theme';

type Props = {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  /** Shown after the number, e.g. "days". */
  unit?: string;
  /** Spoken name, e.g. "Cycle length". */
  label: string;
  format?: (n: number) => string;
  step?: number;
};

/** A − value + control with big targets. Works as an adjustable element for screen readers. */
export function Stepper({ value, onChange, min, max, unit, label, format, step = 1 }: Props) {
  const set = (n: number) => {
    const next = Math.min(max, Math.max(min, n));
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };
  const shown = format ? format(value) : String(value);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${shown}${unit ? ` ${unit}` : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(e.nativeEvent.actionName === 'increment' ? value + step : value - step)}
    >
      <PressableScale onPress={() => set(value - step)} style={styles.btn} accessibilityLabel={`Less ${label}`}>
        <Text style={styles.sign}>−</Text>
      </PressableScale>
      <Text style={styles.value}>
        {shown}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <PressableScale onPress={() => set(value + step)} style={styles.btn} accessibilityLabel={`More ${label}`}>
        <Text style={styles.sign}>+</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: ui.line, alignItems: 'center', justifyContent: 'center' },
  sign: { color: ui.text, fontSize: 26, fontFamily: fonts.regular, marginTop: -2 },
  value: { flex: 1, textAlign: 'center', color: ui.text, fontFamily: fonts.monoMedium, fontSize: 30 },
  unit: { fontFamily: fonts.regular, fontSize: 16, color: ui.muted },
});
