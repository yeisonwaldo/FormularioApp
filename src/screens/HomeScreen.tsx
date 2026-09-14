import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { colors, radius, spacing } from '../theme';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.kicker}>Bienvenido</Text>
        <Text style={styles.title}>Hola, {user?.name ?? 'usuario'}</Text>
        <Text style={styles.subtitle}>
          Sesión iniciada con{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>


        <Pressable onPress={signOut} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  email: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  card: {
    marginTop: 36,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  cardBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  logout: {
    marginTop: 'auto',
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
