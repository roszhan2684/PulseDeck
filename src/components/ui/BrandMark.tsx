import Svg, { ClipPath, Defs, G, LinearGradient, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface BrandMarkProps {
  size?: number;
}

/**
 * The PulseDeck app icon as a vector (same geometry as brand/icon-rounded.svg):
 * a deck of cards with a pulse line on the violet → pink gradient.
 */
export function BrandMark({ size = 32 }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityRole="image" accessibilityLabel="PulseDeck">
      <Defs>
        <LinearGradient id="bm-bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7C5CFF" />
          <Stop offset="0.58" stopColor="#C04FD0" />
          <Stop offset="1" stopColor="#FF4F8B" />
        </LinearGradient>
        <RadialGradient id="bm-hl" cx="0.22" cy="0.12" r="0.8">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="bm-ink" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7C5CFF" />
          <Stop offset="1" stopColor="#FF4F8B" />
        </LinearGradient>
        <ClipPath id="bm-clip">
          <Rect width="1024" height="1024" rx="232" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#bm-clip)">
        <Rect width="1024" height="1024" fill="url(#bm-bg)" />
        <Rect width="1024" height="1024" fill="url(#bm-hl)" />
        <G transform="translate(446 492) rotate(-15)">
          <Rect x="-200" y="-264" width="400" height="528" rx="66" fill="#FFFFFF" fillOpacity={0.3} />
        </G>
        <G transform="translate(552 532) rotate(7)">
          <Rect x="-214" y="-278" width="428" height="556" rx="70" fill="#FFFFFF" />
          <Polyline points="-150,34 -72,34 -38,-84 6,150 48,-34 78,34 112,34" fill="none" stroke="url(#bm-ink)" strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="120" y="4" width="60" height="60" rx="30" fill="#FF4F8B" />
        </G>
      </G>
    </Svg>
  );
}
