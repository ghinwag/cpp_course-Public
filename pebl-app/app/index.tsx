import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getSettings } from '../lib/db';
import { ui } from '../lib/theme';

/** Entry point: first run goes to setup, everyone else straight to Today. */
export default function Index() {
  const db = useSQLiteContext();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings(db).then((s) => setOnboarded(s.onboarded));
  }, [db]);

  if (onboarded === null) return <View style={{ flex: 1, backgroundColor: ui.bg }} />;
  return <Redirect href={onboarded ? '/today' : '/welcome'} />;
}
