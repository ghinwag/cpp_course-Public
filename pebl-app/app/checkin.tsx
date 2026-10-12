import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';
import { PressableScale } from '../components/PressableScale';
import { Button, Label } from '../components/ui';
import { RATINGS, getEventsOn, saveCheckin, type PeblEvent } from '../lib/db';
import { localDate } from '../lib/dates';
import { tagLabel } from '../lib/tags';
import { EASE_OUT, colors } from '../lib/motion';
import { fonts, ui } from '../lib/theme';

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Evening check-in: one question, optional, presented as a form sheet (see _layout). */
export default function Checkin() {
  const db = useSQLiteContext();
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [events, setEvents] = useState<PeblEvent[]>([]);

  useEffect(() => {
    getEventsOn(db, localDate()).then((evs) => {
      setEvents(evs);
      const existing = evs.findLast((e) => e.type === 'checkin');
      if (existing) {
        setRating(existing.rating);
        setNote(existing.note ?? '');
      }
    });
  }, [db]);

  const taps = events.filter((e) => e.type === 'tap');

  const save = async () => {
    if (rating === null) return;
    await saveCheckin(db, rating, note.trim() || null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={styles.sheet}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            How did today feel?
          </Text>
          <Text style={styles.sub}>Skipping is fine.</Text>
        </View>

        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="How did today feel?">
          {RATINGS.map((label, i) => {
            const value = i + 1;
            const selected = rating === value;
            return (
              <PressableScale
                key={label}
                onPress={() => {
                  Haptics.selectionAsync();
                  setRating(value);
                }}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: selected }}
                style={styles.optionHit}
              >
                {/* A state indication, tapped once a day: a short colour transition, nothing more. */}
                <Animated.View
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? colors.rose : ui.line,
                      transitionProperty: 'backgroundColor',
                      transitionDuration: 180,
                      transitionTimingFunction: EASE_OUT,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, selected && { color: colors.black }]}>{label}</Text>
                </Animated.View>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.group}>
          <Label>Today’s taps</Label>
          {taps.length === 0 ? (
            <Text style={styles.empty}>No taps today.</Text>
          ) : (
            taps.map((e) => (
              <View key={e.id} style={styles.tapRow}>
                <Text style={styles.tapTime}>{timeOf(e.timestamp)}</Text>
                <Text style={styles.tapTags}>{e.tags.length ? e.tags.map(tagLabel).join(', ') : 'No tags'}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.group}>
          <Label>Anything else? (optional)</Label>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="A few words, if you like"
            placeholderTextColor={ui.muted}
            multiline
            maxLength={280}
            style={styles.input}
            accessibilityLabel="Note, optional"
          />
        </View>
      </ScrollView>

      <View style={styles.foot}>
        <Button title="Save" onPress={save} disabled={rating === null} />
        <Button title="Skip" kind="plain" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: ui.card },
  body: { padding: 20, paddingTop: 28, gap: 24 },
  head: { gap: 4 },
  title: { color: ui.text, fontFamily: fonts.semibold, fontSize: 26, letterSpacing: -0.5 },
  sub: { color: ui.muted, fontFamily: fonts.regular, fontSize: 16 },
  options: { gap: 8 },
  optionHit: { borderRadius: 16 },
  option: { minHeight: 52, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  optionText: { color: ui.text, fontFamily: fonts.medium, fontSize: 18 },
  group: { gap: 10 },
  empty: { color: ui.faint, fontFamily: fonts.regular, fontSize: 15 },
  tapRow: { flexDirection: 'row', gap: 12, alignItems: 'baseline' },
  tapTime: { color: ui.muted, fontFamily: fonts.mono, fontSize: 15, minWidth: 72 },
  tapTags: { color: ui.text, fontFamily: fonts.regular, fontSize: 16, flex: 1 },
  input: { minHeight: 80, borderRadius: 14, backgroundColor: ui.line, color: ui.text, padding: 14, fontSize: 16, fontFamily: fonts.regular, textAlignVertical: 'top' },
  foot: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 4 },
});
