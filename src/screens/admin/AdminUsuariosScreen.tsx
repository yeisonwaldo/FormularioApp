import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import type { Perfil } from '../../types/db';
import { colors, radius, spacing } from '../../theme';

type PerfilConEmail = Perfil & { email?: string | null };

export function AdminUsuariosScreen() {
  const insets = useSafeAreaInsets();
  const [usuarios, setUsuarios] = useState<PerfilConEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionEnProgreso, setAccionEnProgreso] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    // 1. Consultamos perfiles
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (perfilesError) {
      Alert.alert('Error al cargar usuarios', perfilesError.message);
      setLoading(false);
      return;
    }

    // 2. Intentamos complementar con correos de clientes si existen
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('id, correo');

    const emailMap = new Map<string, string>();
    if (clientesData) {
      clientesData.forEach((c) => {
        if (c.correo) emailMap.set(c.id, c.correo);
      });
    }

    const listaCombinada: PerfilConEmail[] = (perfilesData ?? []).map((p: any) => ({
      ...p,
      email: p.email || emailMap.get(p.id) || null,
    }));

    setUsuarios(listaCombinada);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const asignarRolYEstado = async (id: string, rol: 'admin' | 'cliente', estado: 'activo' | 'pendiente') => {
    setAccionEnProgreso(id);
    const { error } = await supabase
      .from('perfiles')
      .update({ estado, rol } as any)
      .eq('id', id);
    setAccionEnProgreso(null);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchUsuarios();
    }
  };

  const confirmarActivacion = (item: PerfilConEmail) => {
    const ident = item.email ? item.email : `ID: ${item.id.slice(0, 8)}...`;
    Alert.alert(
      'Aprobar Registro',
      `¿Qué rol deseas asignar al usuario con correo:\n${ident}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cliente',
          onPress: () => asignarRolYEstado(item.id, 'cliente', 'activo'),
        },
        {
          text: 'Administrador (Admin)',
          onPress: () => asignarRolYEstado(item.id, 'admin', 'activo'),
        },
      ],
    );
  };

  const confirmarCambioRol = (item: PerfilConEmail) => {
    const nuevoRol: 'admin' | 'cliente' = item.rol === 'admin' ? 'cliente' : 'admin';
    const ident = item.email ? item.email : `ID: ${item.id.slice(0, 8)}...`;
    Alert.alert(
      'Cambiar Rol',
      `¿Deseas cambiar el rol de:\n${ident}\na ${nuevoRol.toUpperCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Asignar ${nuevoRol.toUpperCase()}`,
          onPress: () => asignarRolYEstado(item.id, nuevoRol, 'activo'),
        },
      ],
    );
  };

  const confirmarDesactivacion = (item: PerfilConEmail) => {
    const ident = item.email ? item.email : `ID: ${item.id.slice(0, 8)}...`;
    Alert.alert(
      'Desactivar Cuenta',
      `¿Deseas suspender la cuenta de:\n${ident}?\n\nVolverá al estado "Pendiente" y no podrá acceder al sistema.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => asignarRolYEstado(item.id, item.rol, 'pendiente'),
        },
      ],
    );
  };

  const pendientesCount = usuarios.filter((u) => u.estado === 'pendiente').length;

  const renderItem = ({ item }: { item: PerfilConEmail }) => {
    const isPendiente = item.estado === 'pendiente';
    const esAdmin = item.rol === 'admin';
    const isLoading = accionEnProgreso === item.id;

    return (
      <View style={styles.card}>
        {/* Encabezado de la tarjeta con estado y rol */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isPendiente ? styles.badgePendiente : styles.badgeActivo]}>
            <Text style={[styles.badgeText, isPendiente ? styles.badgeTextPendiente : styles.badgeTextActivo]}>
              {isPendiente ? '⏳ Pendiente' : '✅ Activo'}
            </Text>
          </View>
          <View style={[styles.rolBadge, esAdmin ? styles.rolBadgeAdmin : styles.rolBadgeCliente]}>
            <Text style={[styles.rolText, esAdmin ? styles.rolTextAdmin : styles.rolTextCliente]}>
              {esAdmin ? '🛡️ ADMIN' : '👤 CLIENTE'}
            </Text>
          </View>
        </View>

        {/* Sección destacada del correo electrónico */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Correo registrado:</Text>
          <Text style={styles.emailValue} selectable>
            {item.email ? item.email : '⚠️ Correo no sincronizado en perfil'}
          </Text>
        </View>

        {/* Metadatos secundarios */}
        <View style={styles.metaRow}>
          <Text style={styles.userId} numberOfLines={1}>ID: {item.id}</Text>
          <Text style={styles.fecha}>
            {new Date(item.created_at).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.cardActions}>
          {isPendiente ? (
            <Pressable
              style={[styles.btnActivar, isLoading && styles.btnDisabled]}
              onPress={() => confirmarActivacion(item)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.btnText}>⚡ Activar y asignar rol</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.activeActionsRow}>
              <Pressable
                style={[styles.btnCambiarRol, isLoading && styles.btnDisabled]}
                onPress={() => confirmarCambioRol(item)}
                disabled={isLoading}
              >
                <Text style={styles.btnTextCambiarRol}>
                  Cambiar a {esAdmin ? 'Cliente' : 'Admin'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.btnDesactivar, isLoading && styles.btnDisabled]}
                onPress={() => confirmarDesactivacion(item)}
                disabled={isLoading}
              >
                <Text style={styles.btnTextDesactivar}>Desactivar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text style={styles.headerSubtitle}>
            {pendientesCount === 1 ? '1 solicitud pendiente' : `${pendientesCount} solicitudes pendientes`}
          </Text>
        </View>
        <Pressable onPress={fetchUsuarios} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻ Actualizar</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay usuarios registrados aún.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.muted,
    marginTop: 2,
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.button,
  },
  refreshText: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  list: { padding: spacing.screen, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgePendiente: { backgroundColor: '#FFF3CD' },
  badgeActivo: { backgroundColor: '#D4EDDA' },
  badgeText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  badgeTextPendiente: { color: '#856404' },
  badgeTextActivo: { color: '#155724' },
  rolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolBadgeAdmin: { backgroundColor: '#EDE7F6' },
  rolBadgeCliente: { backgroundColor: '#E3F2FD' },
  rolText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  rolTextAdmin: { color: '#5E35B1' },
  rolTextCliente: { color: '#1976D2' },
  emailContainer: {
    backgroundColor: colors.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  emailLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.muted,
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userId: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    marginRight: 8,
  },
  fecha: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
  },
  cardActions: { marginTop: 4 },
  btnActivar: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCambiarRol: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.button,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  btnTextCambiarRol: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  btnDesactivar: {
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.button,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  btnTextDesactivar: { color: colors.error, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  emptyText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 15 },
});
