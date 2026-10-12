import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BreathingPebble } from '../../components/BreathingPebble';
import { Body, Card, Title } from '../../components/ui';
import { getAllEvents, getCycleStarts, useDataVersion } from '../../lib/db';
import { computePattern, type Pattern, type PatternDay } from '../../lib/pattern';
import { tagLabel } from '../../lib/tags';
import { colors } from '../../lib/motion';
import { fonts, ui } from '../../lib/theme';

// One series per chart, one hue: the deeper rose passes contrast and chroma on the dark card.
const BAR = colors.roseDeep;
const CHART_H = 140;

/**
 * Your pattern, by days before your period. Descriptive only: no predictions.
 * Seen often, so nothing here animates.
 */
export default function PatternScreen() {
  const db = useSQLiteContext();
  const version = useDataVersion();
  const [pattern, setPattern] = useState<Pattern | null>(null);

  useEffect(() => {
    (async () => {
      const [events, starts] = await Promise.all([getAllEvents(db), getCycleStarts(db)]);
      setPattern(computePattern(events, starts));
    })();
  }, [db, version]);

  if (!pattern) return <SafeAreaView style={styles.screen} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Pattern</Title>
        {!pattern.ready ? (
          <View style={styles.empty}>
            <BreathingPebble running={false} size={150} />
            <Text style={styles.emptyTitle} accessibilityRole="header">
              Your pattern appears after one cycle
            </Text>
            <Body style={{ textAlign: 'center' }}>
              Keep tapping and checking in. When your next period starts, log it in Settings (or on Today) and your first pattern shows up here.
            </Body>
          </View>
        ) : (
          <>
            <Body>
              From {pattern.cycles} complete {pattern.cycles === 1 ? 'cycle' : 'cycles'}, by days before your period. A description of what you logged, not a prediction.
            </Body>
            <BarChart
              title="Hard days"
              caption={`Days you checked in as Hard or Awful (out of ${pattern.cycles})`}
              days={pattern.days}
              value={(d) => d.hardDays}
              format={(n) => `${n} hard ${n === 1 ? 'day' : 'days'}`}
            />
            <BarChart
              title="Taps"
              caption={pattern.cycles > 1 ? 'Average taps per day' : 'Taps per day'}
              days={pattern.days}
              value={(d) => d.avgTaps}
              format={(n) => `${n} ${n === 1 ? 'tap' : 'taps'}`}
            />
            <TagList tags={pattern.tagsBefore} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ChartProps = {
  title: string;
  caption: string;
  days: PatternDay[];
  value: (d: PatternDay) => number;
  format: (n: number) => string;
};

function BarChart({ title, caption, days, value, format }: ChartProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const max = Math.max(1, ...days.map(value));
  const pickedDay = days.find((d) => d.before === picked);
  const summary = days
    .filter((d) => value(d) > 0)
    .map((d) => `${d.before} ${d.before === 1 ? 'day' : 'days'} before: ${format(value(d))}`)
    .join('. ');

  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Text style={styles.chartTitle} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>

      {/* Readout for the tapped bar (the touch version of a tooltip). */}
      <Text style={styles.readout} accessibilityElementsHidden importantForAccessibility="no">
        {pickedDay ? `${pickedDay.before} ${pickedDay.before === 1 ? 'day' : 'days'} before · ${format(value(pickedDay))}` : 'Tap a bar for details'}
      </Text>

      <View accessible accessibilityRole="image" accessibilityLabel={`${title}. ${caption}. ${summary || 'None logged yet.'}`}>
        <View style={styles.plot}>
          {/* Recessive baseline and top gridline. */}
          <View style={[styles.grid, { top: 0 }]} />
          <View style={[styles.grid, { bottom: 0 }]} />
          {days.map((d) => {
            const v = value(d);
            const h = v === 0 ? 0 : Math.max(4, (v / max) * CHART_H);
            const active = picked === d.before;
            return (
              <Pressable key={d.before} onPress={() => setPicked(active ? null : d.before)} style={styles.barHit} hitSlop={{ top: 8, bottom: 8 }}>
                <View style={[styles.bar, { height: h, backgroundColor: BAR, opacity: picked === null || active ? 1 : 0.45 }]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.axis}>
          {days.map((d) => (
            <Text key={d.before} style={styles.tick}>
              {d.before === 1 || d.before === 7 || d.before === days[0].before ? d.before : ''}
            </Text>
          ))}
        </View>
        <Text style={styles.axisLabel}>days before period · max {format(max)}</Text>
      </View>
    </Card>
  );
}

function TagList({ tags }: { tags: [string, number][] }) {
  const top = tags.slice(0, 8);
  const max = Math.max(1, ...top.map(([, n]) => n));
  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Text style={styles.chartTitle} accessibilityRole="header">
          Tags in the week before
        </Text>
        <Text style={styles.caption}>What you tagged in the 7 days before your period</Text>
      </View>
      {top.length === 0 ? (
        <Body>No tags in that week yet.</Body>
      ) : (
        top.map(([tag, n]) => (
          <View key={tag} style={styles.tagRow} accessible accessibilityLabel={`${tagLabel(tag)}: ${n}`}>
            <Text style={styles.tagName}>{tagLabel(tag)}</Text>
            <View style={styles.tagTrack}>
              <View style={[styles.tagBar, { width: `${(n / max) * 100}%` }]} />
            </View>
            <Text style={styles.tagCount}>{n}</Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120, gap: 16 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 8 },
  emptyTitle: { color: ui.text, fontFamily: fonts.semibold, fontSize: 20, textAlign: 'center' },
  chartTitle: { color: ui.text, fontFamily: fonts.semibold, fontSize: 18 },
  caption: { color: ui.muted, fontFamily: fonts.regular, fontSize: 14 },
  readout: { color: ui.text, fontFamily: fonts.mono, fontSize: 14, minHeight: 20 },
  plot: { height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  grid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: ui.line },
  barHit: { flex: 1, height: CHART_H, justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', gap: 2, marginTop: 6 },
  tick: { flex: 1, textAlign: 'center', color: ui.muted, fontFamily: fonts.mono, fontSize: 12 },
  axisLabel: { color: ui.faint, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  tagName: { color: ui.text, fontFamily: fonts.regular, fontSize: 15, width: 96 },
  tagTrack: { flex: 1, height: 8 },
  tagBar: { height: 8, borderRadius: 4, backgroundColor: BAR },
  tagCount: { color: ui.text, fontFamily: fonts.mono, fontSize: 14, minWidth: 24, textAlign: 'right' },
});
