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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { AuthInput } from '../components/AuthInput';
import { PrimaryButton } from '../components/PrimaryButton';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(password: string) {
  // Mínimo 8 caracteres, al menos una letra y un número
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const onSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa todos los campos.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (!isStrongPassword(password)) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return;
    }

    setLoading(true);
    const error = await signUp(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Error al registrarse', error);
    } else {
      setRegistered(true);
    }
  };

  if (registered) {
    return (
      <View style={styles.screen}>
        <View style={[styles.centerContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.checkIcon}>✅</Text>
          <Text style={styles.successTitle}>Registro exitoso</Text>
          <Text style={styles.successMsg}>
            Tu cuenta ha sido creada con el estado{' '}
            <Text style={styles.bold}>Pendiente de aprobación</Text>.{'\n\n'}
            Un administrador revisará tu solicitud y activará tu cuenta pronto. Te notificarán por correo.
          </Text>
          <View style={{ marginTop: 32, width: '100%' }}>
            <PrimaryButton title="Volver al login" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Solicitar acceso a la plataforma</Text>

          <View style={styles.form}>
            <AuthInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AuthInput
              placeholder="Contraseña (mín. 8 caracteres + números)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
            <AuthInput
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />

            <PrimaryButton title="Registrarse" onPress={onSignUp} loading={loading} />

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
              <Text style={styles.link}>
                ¿Ya tienes cuenta?{' '}
                <Text style={{ color: colors.primary }}>Inicia sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.screen },
  centerContent: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 60, textAlign: 'center', marginBottom: 16 },
  successTitle: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMsg: {
    color: colors.muted,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  bold: { fontFamily: 'Poppins_600SemiBold', color: colors.text },
  title: {
    color: colors.primary,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  form: { marginTop: 48, gap: 18 },
  linkWrap: { alignItems: 'center', paddingVertical: 8 },
  link: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});
