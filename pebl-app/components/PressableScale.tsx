import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { EASE_OUT } from '../lib/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Press feedback for every Pebl button and card.
 * Scales on press-in (not on release) so the response is instant; commits on press-out.
 * A two-state change, so a CSS transition: no shared value, no worklet.
 */
export function PressableScale({ style, children, onPressIn, onPressOut, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      hitSlop={rest.hitSlop ?? 8}
      pressRetentionOffset={rest.pressRetentionOffset ?? 16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: pressed ? 0.97 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: 120,
            transitionTimingFunction: EASE_OUT,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
