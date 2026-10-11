import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from './PressableScale';
import { colors } from '../lib/motion';
import { TAP, fonts, ui } from '../lib/theme';

/** A dark, scrollable page with safe-area padding. */
export function Screen({ children, scroll = true, edges }: { children: ReactNode; scroll?: boolean; edges?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={styles.screen} edges={edges ?? ['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.title} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'plain';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, kind = 'primary', disabled, accessibilityHint, style }: ButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.button, buttonKinds[kind], disabled && { opacity: 0.4 }, style]}
    >
      <Text style={[styles.buttonText, { color: kind === 'primary' ? colors.black : kind === 'danger' ? ui.danger : ui.text }]}>{title}</Text>
    </PressableScale>
  );
}

/** "pebl." in Bricolage Grotesque Bold. The only place that font is used. */
export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <Text style={{ fontFamily: fonts.wordmark, fontSize: size, color: ui.text, letterSpacing: -0.5 }} accessibilityLabel="Pebl">
      pebl<Text style={{ color: ui.accent }}>.</Text>
    </Text>
  );
}

const buttonKinds = StyleSheet.create({
  primary: { backgroundColor: colors.rose },
  secondary: { backgroundColor: ui.card, borderWidth: 1, borderColor: ui.line },
  danger: { backgroundColor: ui.card, borderWidth: 1, borderColor: '#4A1F2A' },
  plain: { backgroundColor: 'transparent' },
});

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.bg },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  title: { fontFamily: fonts.semibold, fontSize: 30, color: ui.text, letterSpacing: -0.8 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: ui.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: ui.muted },
  card: { backgroundColor: ui.card, borderRadius: 20, padding: 16, gap: 12 },
  button: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minWidth: TAP },
  buttonText: { fontFamily: fonts.semibold, fontSize: 17, textAlign: 'center' },
});
