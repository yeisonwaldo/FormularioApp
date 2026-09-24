import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ─── Auth Stack ────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── Admin Tab Navigator ───────────────────────────────────────────────────────
export type AdminTabParamList = {
  AdminUsuarios: undefined;
  Clientes: undefined;
  Productos: undefined;
  Compras: undefined;
};

// ─── Cliente Tab Navigator ─────────────────────────────────────────────────────
export type ClienteTabParamList = {
  Perfil: undefined;
  Compra: undefined;
};

// ─── Screen Props helpers ──────────────────────────────────────────────────────
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  BottomTabScreenProps<AdminTabParamList, T>;

export type ClienteTabScreenProps<T extends keyof ClienteTabParamList> =
  BottomTabScreenProps<ClienteTabParamList, T>;
