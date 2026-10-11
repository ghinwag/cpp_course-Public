import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PressableScale } from './PressableScale';
import { colors } from '../lib/motion';
import { fonts, ui } from '../lib/theme';
import { localDate } from '../lib/dates';

type Props = {
  value: string | null; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  /** Latest selectable date. Defaults to today: you can't log a period in the future. */
  max?: string;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');

/** A month grid. No animation between months: it's a form control, so changes are instant. */
export function DatePicker({ value, onChange, max = localDate() }: Props) {
  const initial = value ?? max;
  const [year, setYear] = useState(Number(initial.slice(0, 4)));
  const [month, setMonth] = useState(Number(initial.slice(5, 7)) - 1);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const monthName = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const canNext = `${year}-${pad(month + 1)}-01` < max.slice(0, 7) + '-01';

  const shift = (n: number) => {
    const d = new Date(year, month + n, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <PressableScale onPress={() => shift(-1)} style={styles.nav} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text style={styles.navText}>‹</Text>
        </PressableScale>
        <Text style={styles.month} accessibilityRole="header">
          {monthName}
        </Text>
        <PressableScale
          onPress={() => canNext && shift(1)}
          disabled={!canNext}
          style={[styles.nav, !canNext && { opacity: 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text style={styles.navText}>›</Text>
        </PressableScale>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <Text key={`w${i}`} style={styles.weekday} importantForAccessibility="no" accessibilityElementsHidden>
            {w}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const date = `${year}-${pad(month + 1)}-${pad(day)}`;
          const future = date > max;
          const selected = date === value;
          const label = new Date(year, month, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
          return (
            <PressableScale
              key={date}
              disabled={future}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(date);
              }}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected, disabled: future }}
            >
              <View style={[styles.dayDot, selected && { backgroundColor: colors.rose }]}>
                <Text style={[styles.day, future && { color: ui.faint, opacity: 0.4 }, selected && { color: colors.black }]}>{day}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  navText: { color: ui.text, fontSize: 28, fontFamily: fonts.regular },
  month: { color: ui.text, fontSize: 17, fontFamily: fonts.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: ui.faint, fontFamily: fonts.medium, fontSize: 12, paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dayDot: { minWidth: 40, minHeight: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  day: { color: ui.text, fontFamily: fonts.mono, fontSize: 16 },
});
