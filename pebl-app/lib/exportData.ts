import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getAllEvents, getCycleStarts, getSettings } from './db';
import { localDate } from './dates';
import { toCsv } from './csv';

/** Builds the CSV and opens the share sheet (AirDrop, Mail, Files, WhatsApp…). */
export async function exportCsv(db: SQLiteDatabase) {
  const [events, starts, settings] = await Promise.all([getAllEvents(db), getCycleStarts(db), getSettings(db)]);
  const tester = settings.nickname || 'anonymous';
  const csv = toCsv(events, tester, starts);
  const safeName = tester.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'anonymous';
  const filename = `pebl-${safeName}-${localDate()}.csv`;

  if (Platform.OS === 'web') {
    // Web preview only: download the file.
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export my Pebl data',
  });
}
