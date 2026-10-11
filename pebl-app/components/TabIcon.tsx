import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Name = 'today' | 'history' | 'pattern' | 'settings';

/** Simple line icons for the tab bar, drawn in SVG so we need no icon font. */
export function TabIcon({ name, color, size = 26 }: { name: Name; color: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'today' && (
        <Path {...stroke} d="M12.5 4.5c4 -.2 6.8 2.6 6.6 6.2-.2 3.9-3.8 6-7.4 5.8-3.9-.2-6.6-2.5-6.4-5.9.2-3.4 3.1-5.9 7.2-6.1z" />
      )}
      {name === 'history' && (
        <>
          <Rect {...stroke} x="4" y="5" width="16" height="15" rx="3" />
          <Path {...stroke} d="M4 10h16M9 3v4M15 3v4" />
        </>
      )}
      {name === 'pattern' && <Path {...stroke} d="M5 19V13M10 19V8M15 19V11M20 19V5" />}
      {name === 'settings' && (
        <>
          <Path {...stroke} d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <Circle {...stroke} cx="16" cy="7" r="2" />
          <Circle {...stroke} cx="8" cy="17" r="2" />
        </>
      )}
    </Svg>
  );
}
