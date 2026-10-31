import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { colors, typography, type ColorToken, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
}

/** Typography primitive. Supports Dynamic Type up to 1.4× to protect layouts. */
export function Text({ variant = 'body', color = 'text', align, style, maxFontSizeMultiplier = 1.4, ...rest }: TextProps) {
  // A custom fontSize without a lineHeight (e.g. big emoji) would inherit the variant's line height and clip.
  const flat = StyleSheet.flatten(style);
  const lineFix = flat?.fontSize && !flat.lineHeight ? { lineHeight: Math.round(flat.fontSize * 1.25) } : null;
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color: colors[color], textAlign: align }, style, lineFix]}
      {...rest}
    />
  );
}
