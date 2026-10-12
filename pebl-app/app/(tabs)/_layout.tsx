import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '../../lib/motion';
import { ui } from '../../lib/theme';

/**
 * The platform's real tab bar: UITabBar on iPhone (system glass/blur material, SF Symbols),
 * Material bottom navigation on Android. Tab changes are never animated: people switch tabs
 * many times a day, and tabs are peers, not a hierarchy.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.rose}
      iconColor={{ default: ui.faint, selected: colors.rose }}
      labelStyle={{ default: { color: ui.faint }, selected: { color: colors.rose } }}
      blurEffect="systemChromeMaterialDark"
      backgroundColor={ui.bg}
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon sf={{ default: 'circle', selected: 'circle.fill' }} md="radio_button_checked" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pattern">
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
        <NativeTabs.Trigger.Label>Pattern</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
