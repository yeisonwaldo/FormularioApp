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

type PerfilConEmail = Perfil & { email?: string };

export function AdminUsuariosScreen() {
  const insets = useSafeAreaInsets();
  const [usuarios, setUsuarios] = useState<PerfilConEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    // Traemos perfiles + email desde auth.users via vista
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsuarios(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const activar = async (id: string, rol: 'admin' | 'cliente') => {
    setActivando(id);
    const { error } = await supabase
      .from('perfiles')
      .update({ estado: 'activo', rol } as any)
      .eq('id', id);
    setActivando(null);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchUsuarios();
    }
  };

  const confirmarActivacion = (id: string) => {
    Alert.alert(
      'Activar cuenta',
      '¿Qué rol deseas asignar a este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cliente', onPress: () => activar(id, 'cliente') },
        { text: 'Admin', onPress: () => activar(id, 'admin') },
      ],
    );
  };

  const desactivar = (id: string) => {
    Alert.alert('Desactivar', '¿Desactivar esta cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('perfiles').update({ estado: 'pendiente' } as any).eq('id', id);
          fetchUsuarios();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PerfilConEmail }) => {
    const isPendiente = item.estado === 'pendiente';
    const isLoading = activando === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isPendiente ? styles.badgePendiente : styles.badgeActivo]}>
            <Text style={styles.badgeText}>{isPendiente ? 'Pendiente' : 'Activo'}</Text>
          </View>
          <Text style={styles.rolText}>{item.rol.toUpperCase()}</Text>
        </View>
        <Text style={styles.userId} numberOfLines={1}>ID: {item.id}</Text>
        <Text style={styles.fecha}>Registro: {new Date(item.created_at).toLocaleDateString('es-CO')}</Text>

        <View style={styles.cardActions}>
          {isPendiente ? (
            <Pressable
              style={[styles.btnActivar, isLoading && styles.btnDisabled]}
              onPress={() => confirmarActivacion(item.id)}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.btnText}>✅ Activar y asignar rol</Text>
              }
            </Pressable>
          ) : (
            <Pressable style={styles.btnDesactivar} onPress={() => desactivar(item.id)}>
              <Text style={styles.btnTextDesactivar}>Desactivar</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <Pressable onPress={fetchUsuarios} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻ Actualizar</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
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
  refreshBtn: { padding: 8 },
  refreshText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  list: { padding: spacing.screen, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePendiente: { backgroundColor: '#FFF3CD' },
  badgeActivo: { backgroundColor: '#D4EDDA' },
  badgeText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  rolText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  userId: { fontSize: 11, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  fecha: { fontSize: 12, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  cardActions: { marginTop: 8 },
  btnActivar: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDesactivar: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.button,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  btnTextDesactivar: { color: colors.error, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 15 },
});
