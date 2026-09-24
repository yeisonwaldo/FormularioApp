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
import type { Detalle, Encabezado } from '../../types/db';
import { colors, radius, spacing } from '../../theme';

type EncabezadoConDetalles = Encabezado & {
  detalles: (Detalle & { productos: { nombre: string; valor_unitario: number } | null })[];
  cliente_nombre?: string;
};

export function EncabezadosScreen() {
  const insets = useSafeAreaInsets();
  const [compras, setCompras] = useState<EncabezadoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('encabezados')
      .select('*, detalles(*, productos(nombre, valor_unitario))')
      .order('fecha', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setCompras((data as EncabezadoConDetalles[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompras(); }, [fetchCompras]);

  const toggleExpand = (id: string) => {
    setExpandido((prev) => (prev === id ? null : id));
  };

  const renderItem = ({ item }: { item: EncabezadoConDetalles }) => {
    const isOpen = expandido === item.id;
    return (
      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => toggleExpand(item.id)}>
          <View>
            <Text style={styles.cardId} numberOfLines={1}>Orden #{item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.cardFecha}>{new Date(item.fecha).toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.totalText}>$ {item.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </Pressable>

        {isOpen && (
          <View style={styles.detallesWrap}>
            {item.detalles.map((d) => (
              <View key={d.id} style={styles.detalleRow}>
                <Text style={styles.detalleProd} numberOfLines={1}>{d.productos?.nombre ?? '—'}</Text>
                <Text style={styles.detalleCant}>x{d.cantidad}</Text>
                <Text style={styles.detalleValor}>$ {d.valor.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Historial de Compras</Text>
        <Pressable onPress={fetchCompras} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={compras}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay compras registradas aún.</Text>
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
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardId: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  cardFecha: { fontSize: 12, color: colors.muted, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  totalText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.primary },
  chevron: { color: colors.muted, fontSize: 12 },
  detallesWrap: {
    backgroundColor: colors.input,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detalleProd: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  detalleCant: { fontSize: 13, color: colors.muted, fontFamily: 'Poppins_400Regular', minWidth: 28 },
  detalleValor: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, minWidth: 80, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center' },
});
