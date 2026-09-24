import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { AdminNavigator, ClienteNavigator } from './src/navigation/BottomTabNavigator';
import type { AuthStackParamList } from './src/navigation/types';
import { colors } from './src/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

/** Pantalla mostrada cuando la cuenta está pendiente de aprobación */
function PendienteScreen() {
  const { signOut, refreshPerfil } = useAuth();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshPerfil();
    setChecking(false);
  };

  return (
    <View style={[styles.pendiente, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.pendienteIcon}>⏳</Text>
      <Text style={styles.pendienteTitle}>Cuenta pendiente</Text>
      <Text style={styles.pendienteMsg}>
        Tu solicitud de acceso está siendo revisada por un administrador.{'\n\n'}
        Una vez aprobada, podrás iniciar sesión con tu correo y contraseña.
      </Text>
      <View style={{ gap: 12, width: '100%', alignItems: 'center' }}>
        <Pressable onPress={handleRefresh} disabled={checking} style={[styles.refreshBtn, checking && { opacity: 0.7 }]}>
          <Text style={styles.refreshText}>{checking ? 'Verificando...' : 'Comprobar estado'}</Text>
        </Pressable>
        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Sin sesión → pantallas de auth
  if (!user) return <AuthNavigator />;

  // Sesión activa pero cuenta pendiente
  if (!perfil || perfil.estado === 'pendiente') return <PendienteScreen />;

  // Admin → tabs de administrador
  if (perfil.rol === 'admin') return <AdminNavigator />;

  // Cliente activo → tabs de cliente
  return <ClienteNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pendiente: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendienteIcon: { fontSize: 64, marginBottom: 16 },
  pendienteTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  pendienteMsg: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  refreshBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  refreshText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: colors.muted,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.muted,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
});
