import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Title } from '../../components/ui';
import { getAllEvents, getCycleStarts, isHardRating, ratingLabel, useDataVersion } from '../../lib/db';
import { cycleDayFor, parseLocal } from '../../lib/dates';
import { tagLabel } from '../../lib/tags';
import { colors } from '../../lib/motion';
import { fonts, ui } from '../../lib/theme';

type Day = {
  date: string;
  cycleDay: number | null;
  periodStart: boolean;
  taps: number;
  calms: number;
  tags: [string, number][];
  rating: number | null;
  note: string | null;
};

/** Every day with something logged, newest first. Read-only: a record, not a form. */
export default function History() {
  const db = useSQLiteContext();
  const version = useDataVersion();
  const [days, setDays] = useState<Day[] | null>(null);

  useEffect(() => {
    (async () => {
      const [events, starts] = await Promise.all([getAllEvents(db), getCycleStarts(db)]);
      const byDate = new Map<string, Day>();
      const get = (date: string) => {
        let d = byDate.get(date);
        if (!d) {
          d = { date, cycleDay: cycleDayFor(date, starts), periodStart: starts.includes(date), taps: 0, calms: 0, tags: [], rating: null, note: null };
          byDate.set(date, d);
        }
        return d;
      };
      const tagCounts = new Map<string, Map<string, number>>();
      for (const e of events) {
        const d = get(e.local_date);
        if (e.type === 'tap') d.taps++;
        if (e.type === 'calm') d.calms++;
        if (e.type === 'checkin') {
          d.rating = e.rating;
          d.note = e.note;
        }
        const counts = tagCounts.get(d.date) ?? new Map<string, number>();
        for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
        tagCounts.set(d.date, counts);
      }
      for (const s of starts) get(s); // show period starts even on days with nothing else
      for (const [date, counts] of tagCounts) byDate.get(date)!.tags = [...counts].sort((a, b) => b[1] - a[1]);
      setDays([...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1)));
    })();
  }, [db, version]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={days ?? []}
        keyExtractor={(d) => d.date}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Title>History</Title>}
        ListEmptyComponent={days ? <Body>Nothing logged yet. Tap the pebble on Today to log your first moment.</Body> : null}
        renderItem={({ item }) => <DayCard day={item} />}
      />
    </SafeAreaView>
  );
}

function DayCard({ day }: { day: Day }) {
  const dateText = parseLocal(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const counts = [
    day.taps ? `${day.taps} ${day.taps === 1 ? 'tap' : 'taps'}` : null,
    day.calms ? `${day.calms} calm` : null,
  ].filter(Boolean);
  const tags = day.tags.map(([t, n]) => (n > 1 ? `${tagLabel(t)} ×${n}` : tagLabel(t)));
  const spoken = [
    dateText,
    day.cycleDay ? `cycle day ${day.cycleDay}` : null,
    day.periodStart ? 'period started' : null,
    ...counts,
    tags.length ? `tags: ${tags.join(', ')}` : null,
    day.rating ? `felt ${ratingLabel(day.rating)}` : null,
    day.note,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.card} accessible accessibilityLabel={spoken}>
      <View style={styles.row}>
        <Text style={styles.date}>{dateText}</Text>
        <Text style={styles.cycleDay}>{day.cycleDay ? `Day ${day.cycleDay}` : ''}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.counts}>{day.periodStart ? ['Period started', ...counts].join(' · ') : counts.join(' · ') || 'No taps'}</Text>
        {day.rating ? (
          <View style={[styles.pill, isHardRating(day.rating) && { backgroundColor: colors.cherry }]}>
            <Text style={styles.pillText}>{ratingLabel(day.rating)}</Text>
          </View>
        ) : null}
      </View>
      {tags.length ? <Text style={styles.tags}>{tags.join(' · ')}</Text> : null}
      {day.note ? <Text style={styles.note}>“{day.note}”</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: ui.card, borderRadius: 18, padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  date: { color: ui.text, fontFamily: fonts.semibold, fontSize: 17 },
  cycleDay: { color: ui.accent, fontFamily: fonts.monoMedium, fontSize: 15 },
  counts: { color: ui.muted, fontFamily: fonts.regular, fontSize: 15, flexShrink: 1 },
  pill: { backgroundColor: ui.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  pillText: { color: ui.text, fontFamily: fonts.medium, fontSize: 14 },
  tags: { color: ui.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  note: { color: ui.muted, fontFamily: fonts.regular, fontSize: 15 },
});
