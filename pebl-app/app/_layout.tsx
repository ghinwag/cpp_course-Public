import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { DB_NAME, migrate } from '../lib/db';
import { configureNotifications } from '../lib/reminders';
import { ui } from '../lib/theme';

SplashScreen.preventAutoHideAsync();
if (Platform.OS !== 'web') configureNotifications();

/** Tapping the evening reminder opens the check-in. Phone only: there are no reminders on web. */
function ReminderOpener() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as '/checkin');
  }, [response]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    BricolageGrotesque_700Bold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: ui.bg }}>
      <SQLiteProvider databaseName={DB_NAME} onInit={migrate}>
        <StatusBar style="light" />
        {Platform.OS !== 'web' ? <ReminderOpener /> : null}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ui.bg } }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          {/* Native presentations only: never a JS-built screen transition. */}
          <Stack.Screen name="calm" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          {/* Standard iOS card sheets: swipe down to dismiss. Reliable with scrolling content. */}
          <Stack.Screen name="checkin" options={{ presentation: 'modal', contentStyle: { backgroundColor: ui.card } }} />
          <Stack.Screen name="tag" options={{ presentation: 'modal', contentStyle: { backgroundColor: ui.card } }} />
          {/* First run only. Fade, never a slide: it is not a level deeper than anything. */}
          <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
