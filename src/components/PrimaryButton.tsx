import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
};

export function PrimaryButton({ title, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
});
