import type { LucideIcon } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, fonts, hitSlop, radii, space } from '@/theme';
import { duration } from '@/theme/motion';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: LucideIcon;
  /** Optional trailing element, e.g. an availability check. */
  trailing?: React.ReactNode;
  ref?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

/** Text input with animated focus border, error shake and announced error message. */
export function TextField({ label, error, hint, icon: Icon, trailing, secureTextEntry, onFocus, onBlur, style, ref, ...rest }: TextFieldProps) {
  const reduced = useReducedMotionPref();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error && !reduced) shake.set(withSequence(withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }), withTiming(-3, { duration: 50 }), withTiming(0, { duration: 50 })));
  }, [error, reduced, shake]);

  const box = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : interpolateColor(focus.get(), [0, 1], [colors.border, colors.primary]),
    transform: [{ translateX: shake.get() }],
  }));

  return (
    <View style={styles.wrap}>
      <Text variant="caption" color="textMuted" style={styles.label} nativeID={`${label}-label`}>
        {label}
      </Text>
      <Animated.View style={[styles.box, box]}>
        {Icon && <Icon size={18} color={colors.textSubtle} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          keyboardAppearance="dark"
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={hidden}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: duration.fast }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: duration.fast }));
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          maxFontSizeMultiplier={1.3}
          {...rest}
        />
        {trailing}
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            {hidden ? <Eye size={18} color={colors.textMuted} /> : <EyeOff size={18} color={colors.textMuted} />}
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Animated.View entering={FadeIn.duration(duration.fast)} exiting={FadeOut.duration(duration.instant)}>
          <Text variant="caption" color="danger" accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.msg}>
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" color="textSubtle" style={styles.msg}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { marginLeft: space.xxs },
  box: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, paddingHorizontal: space.md, backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: radii.md },
  input: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingVertical: space.sm },
  msg: { marginLeft: space.xxs },
});
