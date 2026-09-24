import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';

// Admin screens
import { AdminUsuariosScreen } from '../screens/admin/AdminUsuariosScreen';
import { ClientesAdminScreen } from '../screens/admin/ClientesAdminScreen';
import { ProductosScreen } from '../screens/admin/ProductosScreen';
import { EncabezadosScreen } from '../screens/admin/EncabezadosScreen';

// Cliente screens
import { PerfilClienteScreen } from '../screens/cliente/PerfilClienteScreen';
import { CompraScreen } from '../screens/cliente/CompraScreen';

import type { AdminTabParamList, ClienteTabParamList } from './types';
import { colors } from '../theme';

const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const ClienteTab = createBottomTabNavigator<ClienteTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? colors.primary : colors.muted}
    />
  );
}

function LogoutHeaderButton() {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
      ],
    );
  };

  return (
    <Pressable onPress={handleLogout} style={styles.logoutHeaderBtn}>
      <Ionicons name="log-out-outline" size={22} color={colors.error} />
      <Text style={styles.logoutHeaderText}>Salir</Text>
    </Pressable>
  );
}

export function AdminNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => <LogoutHeaderButton />,
        tabBarStyle: [styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <AdminTab.Screen
        name="AdminUsuarios"
        component={AdminUsuariosScreen}
        options={{
          headerTitle: 'Gestión de Solicitudes',
          tabBarLabel: 'Solicitudes',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />,
        }}
      />
      <AdminTab.Screen
        name="Clientes"
        component={ClientesAdminScreen}
        options={{
          headerTitle: 'Directorio de Clientes',
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
      <AdminTab.Screen
        name="Productos"
        component={ProductosScreen}
        options={{
          headerTitle: 'Gestión de Productos',
          tabBarLabel: 'Productos',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cube' : 'cube-outline'} focused={focused} />,
        }}
      />
      <AdminTab.Screen
        name="Compras"
        component={EncabezadosScreen}
        options={{
          headerTitle: 'Historial de Compras',
          tabBarLabel: 'Compras',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} />,
        }}
      />
    </AdminTab.Navigator>
  );
}

export function ClienteNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <ClienteTab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => <LogoutHeaderButton />,
        tabBarStyle: [styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <ClienteTab.Screen
        name="Perfil"
        component={PerfilClienteScreen}
        options={{
          headerTitle: 'Mi Perfil',
          tabBarLabel: 'Mi Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} focused={focused} />,
        }}
      />
      <ClienteTab.Screen
        name="Compra"
        component={CompraScreen}
        options={{
          headerTitle: 'Realizar Compra',
          tabBarLabel: 'Comprar',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cart' : 'cart-outline'} focused={focused} />,
        }}
      />
    </ClienteTab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.text,
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  logoutHeaderText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.error,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
});
