import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymptomChip } from '../components/SymptomChip';
import { Button, Label } from '../components/ui';
import { getEvent, getUsedTags, setEventTags } from '../lib/db';
import { PRESET_TAGS, TAG_GROUPS, normaliseTag, tagLabel } from '../lib/tags';
import { colors } from '../lib/motion';
import { fonts, ui } from '../lib/theme';

/**
 * Quick tags after a tap. Fully skippable: swipe down or press Skip.
 * Each chip saves immediately, so dismissing never loses a choice.
 */
export default function TagSheet() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    (async () => {
      const [ev, used] = await Promise.all([getEvent(db, eventId), getUsedTags(db)]);
      if (ev) setSelected(ev.tags);
      setCustom(used.filter((t) => !PRESET_TAGS.includes(t)).slice(0, 12));
    })();
  }, [db, eventId]);

  const toggle = (tag: string) => {
    const next = selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag];
    setSelected(next);
    setEventTags(db, eventId, next);
  };

  const addOwn = () => {
    const tag = normaliseTag(draft);
    setDraft('');
    setAdding(false);
    if (!tag) return;
    if (!custom.includes(tag) && !PRESET_TAGS.includes(tag)) setCustom((c) => [tag, ...c]);
    if (!selected.includes(tag)) toggle(tag);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Logged. What’s going on?
        </Text>
        <Text style={styles.sub}>Add a tag if you like, or swipe down to skip.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {TAG_GROUPS.map((g) => (
          <View key={g.name} style={styles.group}>
            <Label>{g.name}</Label>
            <View style={styles.chips}>
              {g.tags.map((t) => (
                <SymptomChip key={t} label={tagLabel(t)} tint={g.tint} selected={selected.includes(t)} onToggle={() => toggle(t)} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.group}>
          <Label>Your own</Label>
          <View style={styles.chips}>
            {custom.map((t) => (
              <SymptomChip key={t} label={tagLabel(t)} tint={colors.roseText} selected={selected.includes(t)} onToggle={() => toggle(t)} />
            ))}
            {!adding ? <SymptomChip label="+ Your own" selected={false} onToggle={() => setAdding(true)} /> : null}
          </View>
          {adding ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addOwn}
              onBlur={addOwn}
              placeholder="e.g. cravings"
              placeholderTextColor={ui.muted}
              returnKeyType="done"
              maxLength={30}
              style={styles.input}
              accessibilityLabel="Your own tag"
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.foot}>
        <Button title={selected.length ? 'Done' : 'Skip'} onPress={() => router.back()} kind={selected.length ? 'primary' : 'secondary'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: ui.card },
  head: { paddingHorizontal: 20, paddingTop: 24, gap: 4 },
  title: { color: ui.text, fontFamily: fonts.semibold, fontSize: 22 },
  sub: { color: ui.muted, fontFamily: fonts.regular, fontSize: 15 },
  body: { padding: 20, gap: 20 },
  group: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: ui.line, color: ui.text, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.regular },
  foot: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
});
