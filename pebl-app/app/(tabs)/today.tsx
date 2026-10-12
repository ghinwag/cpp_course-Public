import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Pebble } from '../../components/Pebble';
import { PressableScale } from '../../components/PressableScale';
import { useToast } from '../../components/Toast';
import { Wordmark } from '../../components/ui';
import { addEvent, addPeriodStart, getCycleStarts, getEventsOn, getSettings, ratingLabel, useDataVersion, type PeblEvent } from '../../lib/db';
import { cycleDayFor, localDate } from '../../lib/dates';
import { tagLabel } from '../../lib/tags';
import { confirm } from '../../lib/confirm';
import { colors } from '../../lib/motion';
import { fonts, ui } from '../../lib/theme';

export default function Today() {
  const db = useSQLiteContext();
  const version = useDataVersion();
  const toast = useToast();
  const [events, setEvents] = useState<PeblEvent[]>([]);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [cycleLength, setCycleLength] = useState<number | null>(28);
  const [nickname, setNickname] = useState('');
  const today = localDate();

  useEffect(() => {
    (async () => {
      const [s, starts, evs] = await Promise.all([getSettings(db), getCycleStarts(db), getEventsOn(db, today)]);
      setNickname(s.nickname);
      setCycleLength(s.cycleLength);
      setCycleDay(cycleDayFor(today, starts));
      setEvents(evs);
    })();
  }, [db, version, today]);

  const taps = events.filter((e) => e.type === 'tap');
  const calms = events.filter((e) => e.type === 'calm').length;
  const checkin = events.findLast((e) => e.type === 'checkin');
  const tagsToday = [...new Set(taps.flatMap((e) => e.tags))];
  // Near or past the usual length: offer a one-tap way to log a new period.
  const periodDue = cycleDay !== null && cycleDay >= (cycleLength ?? 28) - 2;

  const onTap = async () => {
    const id = await addEvent(db, 'tap');
    toast.show('Logged');
    router.push({ pathname: '/tag', params: { id: String(id) } });
  };

  const logPeriod = async () => {
    if (await confirm('Period started today?', 'This starts a new cycle at Day 1.', 'Yes, Day 1')) addPeriodStart(db, today);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {toast.node}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Wordmark />
          {nickname ? <Text style={styles.hello}>Hi, {nickname}</Text> : null}
        </View>

        {/* The hero: the pebble, centred in the free space, on a still glow (no idle motion). */}
        <View style={styles.pebbleArea}>
          <View style={styles.glow} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="todayGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.rose} stopOpacity={0.28} />
                  <Stop offset="100%" stopColor={colors.rose} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="50" fill="url(#todayGlow)" />
            </Svg>
          </View>
          <Pebble onTap={onTap} onHold={() => router.push('/calm')} size={300} />
          {/* Teach the two gestures until the first tap of the day, then get out of the way. */}
          <Text style={[styles.hint, taps.length > 0 && { opacity: 0 }]}>Tap to log a moment · Hold to calm</Text>
        </View>

        <View style={styles.stats} accessible accessibilityLabel={`${cycleDay ? `Cycle day ${cycleDay}. ` : ''}${taps.length} ${taps.length === 1 ? 'tap' : 'taps'} today.`}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{cycleDay ? `Day ${cycleDay}` : '–'}</Text>
            <Text style={styles.statLabel}>of your cycle</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{taps.length}</Text>
            <Text style={styles.statLabel}>{taps.length === 1 ? 'tap today' : 'taps today'}</Text>
          </View>
        </View>

        {tagsToday.length > 0 || calms > 0 ? (
          <Text style={styles.tagLine}>
            {[...tagsToday.map(tagLabel), calms ? `${calms} calm ${calms === 1 ? 'session' : 'sessions'}` : null].filter(Boolean).join(' · ')}
          </Text>
        ) : null}

        <PressableScale
          onPress={() => router.push('/checkin')}
          style={styles.checkin}
          accessibilityRole="button"
          accessibilityLabel={checkin ? `Today felt ${ratingLabel(checkin.rating)}. Change check-in` : 'Evening check-in: how did today feel?'}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.checkinTitle}>{checkin ? `Today felt ${ratingLabel(checkin.rating).toLowerCase()}` : 'How did today feel?'}</Text>
            <Text style={styles.checkinSub}>{checkin ? 'Tap to change' : 'Evening check-in · optional'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </PressableScale>

        {periodDue ? (
          <PressableScale onPress={logPeriod} style={styles.period} accessibilityRole="button" accessibilityLabel="My period started today">
            <Text style={styles.periodText}>Period started today?</Text>
          </PressableScale>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.bg },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', minHeight: 44 },
  hello: { color: ui.muted, fontFamily: fonts.regular, fontSize: 16 },
  pebbleArea: { flexGrow: 1, minHeight: 340, alignItems: 'center', justifyContent: 'center', gap: 8 },
  glow: { position: 'absolute', width: 420, height: 420 },
  hint: { color: ui.faint, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  stats: { flexDirection: 'row', backgroundColor: ui.card, borderRadius: 20, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  statNum: { color: ui.text, fontFamily: fonts.monoMedium, fontSize: 30, letterSpacing: -1 },
  statLabel: { color: ui.muted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: ui.line },
  tagLine: { color: ui.muted, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center' },
  checkin: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ui.card, borderRadius: 20, padding: 18 },
  chevron: { color: ui.faint, fontSize: 28, fontFamily: fonts.regular, marginTop: -2 },
  checkinTitle: { color: ui.text, fontFamily: fonts.semibold, fontSize: 18 },
  checkinSub: { color: ui.muted, fontFamily: fonts.regular, fontSize: 14 },
  period: { minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.roseText, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  periodText: { color: ui.accent, fontFamily: fonts.medium, fontSize: 16 },
});
