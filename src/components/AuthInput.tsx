import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius } from '../theme';

export function AuthInput({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <TextInput
        placeholderTextColor="#9A8B88"
        style={[styles.input, style]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.input,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  wrapFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4F1',
  },
  input: {
    height: 56,
    paddingHorizontal: 18,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
  },
});
