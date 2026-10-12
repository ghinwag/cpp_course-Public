import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { DatePicker } from '../../components/DatePicker';
import { PressableScale } from '../../components/PressableScale';
import { Stepper } from '../../components/Stepper';
import { SymptomChip } from '../../components/SymptomChip';
import { Body, Button, Card, Label, Screen, Title } from '../../components/ui';
import {
  addPeriodStart,
  deleteEverything,
  getCycleStarts,
  getSettings,
  removePeriodStart,
  saveSettings,
  setLatestPeriodStart,
  useDataVersion,
  type Settings,
} from '../../lib/db';
import { localDate, parseLocal } from '../../lib/dates';
import { confirm, notify } from '../../lib/confirm';
import { exportCsv } from '../../lib/exportData';
import { cancelReminders, ensurePermission, scheduleDailyReminder } from '../../lib/reminders';
import { colors } from '../../lib/motion';
import { fonts, ui } from '../../lib/theme';

const longDate = (d: string) => parseLocal(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** 'HH:MM' ↔ minutes since midnight, for the reminder stepper. */
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const showTime = (m: number) => new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

type Picker = null | 'edit-last' | 'add-start';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const version = useDataVersion();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [starts, setStarts] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [picker, setPicker] = useState<Picker>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, st] = await Promise.all([getSettings(db), getCycleStarts(db)]);
      setSettings(s);
      setNickname(s.nickname);
      setStarts(st);
    })();
  }, [db, version]);

  if (!settings) return <Screen>{null}</Screen>;

  const latest = starts.at(-1) ?? null;
  const today = localDate();
  const reminderMinutes = toMinutes(settings.reminderTime);

  const setReminder = async (on: boolean, time = settings.reminderTime) => {
    if (on) {
      if (!(await ensurePermission())) {
        notify('Notifications are off', 'To get a reminder, allow notifications for Expo Go (or Pebl) in your phone’s Settings.');
        return;
      }
      await scheduleDailyReminder(time);
    } else {
      await cancelReminders();
    }
    await saveSettings(db, { reminderOn: on, reminderTime: time });
  };

  const onExport = async () => {
    setBusy(true);
    try {
      await exportCsv(db);
    } catch (e) {
      notify('Export failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    const sure = await confirm(
      'Delete all your data?',
      'Every tap, tag, check-in and period date on this phone will be erased. This can’t be undone. Export first if you want a copy.',
      'Delete everything',
      true,
    );
    if (!sure) return;
    if (Platform.OS !== 'web') await cancelReminders();
    await deleteEverything(db);
    router.replace('/welcome');
  };

  return (
    <Screen>
      <Title>Settings</Title>

      {/* ---------- Cycle ---------- */}
      <Label>Your cycle</Label>
      <Card>
        <Row label="Last period started" value={latest ? longDate(latest) : 'Not set'} action="Edit" onPress={() => setPicker(picker === 'edit-last' ? null : 'edit-last')} />
        {picker === 'edit-last' ? (
          <DatePicker
            value={latest}
            onChange={async (d) => {
              await setLatestPeriodStart(db, d);
              setPicker(null);
            }}
          />
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.rowLabel}>Usual cycle length</Text>
        <View style={{ opacity: settings.cycleLength === null ? 0.35 : 1 }} pointerEvents={settings.cycleLength === null ? 'none' : 'auto'}>
          <Stepper
            value={settings.cycleLength ?? 28}
            onChange={(n) => saveSettings(db, { cycleLength: n })}
            min={18}
            max={45}
            unit="days"
            label="Cycle length"
          />
        </View>
        <View style={{ alignItems: 'center' }}>
          <SymptomChip label="Not sure" selected={settings.cycleLength === null} onToggle={() => saveSettings(db, { cycleLength: settings.cycleLength === null ? 28 : null })} />
        </View>
      </Card>

      {/* ---------- Periods ---------- */}
      <Label>Log a period</Label>
      <Card>
        {latest === today ? (
          // Status, not a dead button: say what's true.
          <Text style={styles.status} accessibilityLiveRegion="polite">
            ✓  Period logged for today
          </Text>
        ) : (
          <Button
            title="My period started today"
            onPress={async () => {
              if (await confirm('Period started today?', 'This starts a new cycle at Day 1.', 'Yes, Day 1')) addPeriodStart(db, today);
            }}
          />
        )}
        <Button title={picker === 'add-start' ? 'Close' : 'It started on another day…'} kind="secondary" onPress={() => setPicker(picker === 'add-start' ? null : 'add-start')} />
        {picker === 'add-start' ? (
          <DatePicker
            value={null}
            onChange={async (d) => {
              await addPeriodStart(db, d);
              setPicker(null);
            }}
          />
        ) : null}
        {starts.length ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.small}>Logged period starts</Text>
            {[...starts].reverse().map((s) => (
              <View key={s} style={styles.startRow}>
                <Text style={styles.startDate}>{longDate(s)}</Text>
                <PressableScale
                  onPress={async () => {
                    if (await confirm('Remove this period date?', longDate(s), 'Remove', true)) removePeriodStart(db, s);
                  }}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove period start ${longDate(s)}`}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </PressableScale>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* ---------- Reminder ---------- */}
      <Label>Evening reminder</Label>
      <Card>
        {Platform.OS === 'web' ? (
          <Body>Reminders work in the phone app.</Body>
        ) : (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>Daily check-in reminder</Text>
              <Switch
                value={settings.reminderOn}
                onValueChange={(on) => setReminder(on)}
                trackColor={{ true: colors.roseText, false: ui.line }}
                thumbColor={colors.pearl}
                accessibilityLabel="Daily check-in reminder"
              />
            </View>
            {settings.reminderOn ? (
              <Stepper
                value={reminderMinutes}
                onChange={(m) => setReminder(true, fromMinutes(m))}
                min={0}
                max={23 * 60 + 45}
                step={15}
                format={showTime}
                label="Reminder time"
              />
            ) : null}
          </>
        )}
      </Card>

      {/* ---------- Profile ---------- */}
      <Label>Nickname</Label>
      <Card>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          onEndEditing={() => saveSettings(db, { nickname })}
          onBlur={() => saveSettings(db, { nickname })}
          placeholder="Optional"
          placeholderTextColor={ui.faint}
          maxLength={32}
          style={styles.input}
          accessibilityLabel="Nickname"
        />
        <Text style={styles.small}>Added to your export so your file can be told apart from other testers’.</Text>
      </Card>

      {/* ---------- Data ---------- */}
      <Label>Your data</Label>
      <Card>
        <Body>Everything stays on this phone. Nothing is uploaded unless you share it.</Body>
        <Button title={busy ? 'Preparing…' : 'Export my data (CSV)'} onPress={onExport} disabled={busy} kind="secondary" />
        <Button title="Delete all my data" onPress={onDelete} kind="danger" accessibilityHint="Asks you to confirm first" />
      </Card>

      <Text style={styles.footer}>Pebl is a wellness tool for noticing your own patterns. It is not a medical device and doesn’t diagnose or treat any condition.</Text>
    </Screen>
  );
}

function Row({ label, value, action, onPress }: { label: string; value: string; action: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. ${action}`}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <Text style={styles.action}>{action}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 },
  rowLabel: { color: ui.text, fontFamily: fonts.medium, fontSize: 16 },
  rowValue: { color: ui.muted, fontFamily: fonts.mono, fontSize: 15 },
  action: { color: ui.accent, fontFamily: fonts.medium, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.line },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, gap: 12 },
  status: { color: ui.accent, fontFamily: fonts.medium, fontSize: 17, textAlign: 'center', paddingVertical: 12 },
  small: { color: ui.faint, fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  startRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  startDate: { color: ui.text, fontFamily: fonts.mono, fontSize: 15 },
  removeBtn: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' },
  removeText: { color: ui.danger, fontFamily: fonts.medium, fontSize: 15 },
  input: { minHeight: 52, borderRadius: 14, backgroundColor: ui.line, color: ui.text, paddingHorizontal: 14, fontSize: 17, fontFamily: fonts.regular },
  footer: { color: ui.faint, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8, marginTop: 8 },
});
