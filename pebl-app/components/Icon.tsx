import Svg, { Path } from 'react-native-svg';

/** Small line icons drawn in SVG, so they look the same on every phone (no text glyphs). */
export function Icon({ name, color, size = 18 }: { name: 'check' | 'chevron'; color: string; size?: number }) {
  const stroke = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'check' ? <Path {...stroke} d="M5 12.5l4.5 4.5L19 7.5" /> : <Path {...stroke} d="M9 5l7 7-7 7" />}
    </Svg>
  );
}
