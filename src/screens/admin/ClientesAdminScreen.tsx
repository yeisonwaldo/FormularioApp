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
import type { Cliente } from '../../types/db';
import { colors, radius, spacing } from '../../theme';

export function ClientesAdminScreen() {
  const insets = useSafeAreaInsets();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre');
    if (error) Alert.alert('Error', error.message);
    else setClientes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nombre.charAt(0).toUpperCase()}{item.apellido.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.correo}>{item.correo}</Text>
        <Text style={styles.fecha}>Desde: {new Date(item.fecha).toLocaleDateString('es-CO')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Clientes Registrados</Text>
        <Pressable onPress={fetchClientes} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aún no hay clientes con perfil completo.</Text>
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
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  refreshBtn: { padding: 8 },
  refreshText: { color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 20 },
  list: { padding: spacing.screen, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 16 },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  correo: { fontSize: 13, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  fecha: { fontSize: 12, color: colors.muted, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center' },
});
