import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { TEST_USER } from '../auth/users';
import { AuthInput } from '../components/AuthInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignIn = () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Revisa el formato del correo.');
      return;
    }

    const error = signIn(email, password);
    if (error) {
      Alert.alert('No se pudo iniciar sesión', error);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

          <View style={styles.form}>
            <AuthInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AuthInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Usuario de prueba',
                  `Usa estas credenciales:\n\nCorreo: ${TEST_USER.email}\nContraseña: ${TEST_USER.password}`,
                )
              }
            >
              <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <PrimaryButton title="Iniciar sesión" onPress={onSignIn} />

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
              <Text style={styles.link}>Crear nueva cuenta</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
  },
  title: {
    color: colors.primary,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  form: {
    marginTop: 48,
    gap: 18,
  },
  forgot: {
    alignSelf: 'flex-end',
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: -4,
    marginBottom: 8,
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  hint: {
    marginTop: 'auto',
    paddingTop: 24,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
