import { Tabs } from 'expo-router';
import { TabIcon } from '../../components/TabIcon';
import { fonts, ui } from '../../lib/theme';

/**
 * Four tabs. Tab changes are deliberately not animated (animation: 'none'):
 * people switch tabs many times a day, so motion would only slow them down.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: ui.bg },
        tabBarActiveTintColor: ui.accent,
        tabBarInactiveTintColor: ui.faint,
        tabBarStyle: { backgroundColor: ui.bg, borderTopColor: ui.line },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: ({ color }) => <TabIcon name="today" color={color as string} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <TabIcon name="history" color={color as string} /> }} />
      <Tabs.Screen name="pattern" options={{ title: 'Pattern', tabBarIcon: ({ color }) => <TabIcon name="pattern" color={color as string} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon name="settings" color={color as string} /> }} />
    </Tabs>
  );
}
