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
import { AuthInput } from '../components/AuthInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSignUp = () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa todos los campos para continuar.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Revisa el formato del correo.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Usa al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('No coinciden', 'Las contraseñas no son iguales.');
      return;
    }

    const error = signUp(email, password);
    if (error) {
      Alert.alert('No se pudo crear la cuenta', error);
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
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Crea una cuenta para explorar
          </Text>

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
              placeholder="Contraseña"
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

            <View style={styles.buttonWrap}>
              <PrimaryButton title="Crear cuenta" onPress={onSignUp} />
            </View>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
              <Text style={styles.link}>Ya tienes una cuenta</Text>
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
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  form: {
    marginTop: 40,
    gap: 18,
  },
  buttonWrap: {
    marginTop: 10,
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
});
