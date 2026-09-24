import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import type { Cliente, ItemCarrito, Producto } from '../../types/db';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing } from '../../theme';

export function CompraScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carrito, setCarrito] = useState<Map<string, ItemCarrito>>(new Map());
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: prods }, { data: cli }] = await Promise.all([
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('clientes').select('*').eq('id', user.id).single(),
    ]);
    setProductos(prods ?? []);
    setCliente(cli ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const total = useMemo(() => {
    let t = 0;
    carrito.forEach((item) => { t += item.producto.valor_unitario * item.cantidad; });
    return t;
  }, [carrito]);

  const itemsCarrito = useMemo(() => Array.from(carrito.values()), [carrito]);

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.stock === 0) return;
    setCarrito((prev) => {
      const next = new Map(prev);
      const actual = next.get(producto.id);
      const cantidadActual = actual?.cantidad ?? 0;
      if (cantidadActual >= producto.stock) {
        Alert.alert('Stock agotado', `Solo hay ${producto.stock} unidades disponibles.`);
        return prev;
      }
      next.set(producto.id, { producto, cantidad: cantidadActual + 1 });
      return next;
    });
  };

  const quitarDelCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const next = new Map(prev);
      const actual = next.get(producto.id);
      if (!actual) return prev;
      if (actual.cantidad <= 1) {
        next.delete(producto.id);
      } else {
        next.set(producto.id, { ...actual, cantidad: actual.cantidad - 1 });
      }
      return next;
    });
  };

  const confirmarCompra = async () => {
    if (!user || !cliente) {
      Alert.alert('Perfil incompleto', 'Debes completar tu perfil antes de comprar.');
      return;
    }
    if (carrito.size === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un producto al carrito.');
      return;
    }

    Alert.alert(
      'Confirmar compra',
      `Total: $${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}\n¿Deseas confirmar el pedido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: procesarCompra },
      ],
    );
  };

  const procesarCompra = async () => {
    if (!user) return;
    setComprando(true);

    const items = Array.from(carrito.values()).map((i) => ({
      id_producto: i.producto.id,
      cantidad: i.cantidad,
    }));

    const { error } = await (supabase.rpc as any)('realizar_compra', {
      p_id_cliente: user.id,
      p_items: items,
    });

    setComprando(false);

    if (error) {
      Alert.alert('Error en la compra', error.message);
    } else {
      setCarrito(new Map());
      Alert.alert('¡Compra realizada!', 'Tu pedido fue registrado exitosamente. 🎉');
      fetchData(); // refresca stock
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Bloqueo si no tiene perfil
  if (!cliente) {
    return (
      <View style={[styles.center, { paddingHorizontal: spacing.screen }]}>
        <Text style={styles.blockIcon}>🔒</Text>
        <Text style={styles.blockTitle}>Perfil incompleto</Text>
        <Text style={styles.blockMsg}>
          Debes completar tus datos personales en la pestaña "Mi Perfil" antes de realizar compras.
        </Text>
      </View>
    );
  }

  // Bloqueo si no hay productos
  if (productos.length === 0) {
    return (
      <View style={[styles.center, { paddingHorizontal: spacing.screen }]}>
        <Text style={styles.blockIcon}>📦</Text>
        <Text style={styles.blockTitle}>Sin productos</Text>
        <Text style={styles.blockMsg}>
          El catálogo está vacío. Espera a que el administrador agregue productos.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Catálogo de Productos</Text>
        <Text style={styles.cartCount}>{itemsCarrito.length > 0 ? `🛒 ${itemsCarrito.reduce((a, i) => a + i.cantidad, 0)}` : '🛒'}</Text>
      </View>

      <FlatList
        data={productos}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const enCarrito = carrito.get(item.id)?.cantidad ?? 0;
          const sinStock = item.stock === 0;
          return (
            <View style={[styles.card, sinStock && styles.cardDisabled]}>
              <View style={styles.cardTop}>
                <Text style={styles.productName} numberOfLines={2}>{item.nombre}</Text>
                <View style={[styles.stockBadge, sinStock && styles.stockEmpty]}>
                  <Text style={styles.stockText}>{sinStock ? 'Agotado' : `Stock: ${item.stock}`}</Text>
                </View>
              </View>
              {item.descripcion && <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>}
              <Text style={styles.precio}>$ {item.valor_unitario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Text>

              {!sinStock && (
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyBtn} onPress={() => quitarDelCarrito(item)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{enCarrito}</Text>
                  <Pressable
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => agregarAlCarrito(item)}
                    disabled={enCarrito >= item.stock}
                  >
                    <Text style={[styles.qtyBtnText, { color: colors.white }]}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          itemsCarrito.length > 0 ? (
            <View style={styles.resumen}>
              <Text style={styles.resumenTitle}>🛒 Resumen del pedido</Text>
              {itemsCarrito.map((i) => (
                <View key={i.producto.id} style={styles.resumenRow}>
                  <Text style={styles.resumenProd} numberOfLines={1}>{i.producto.nombre}</Text>
                  <Text style={styles.resumenCant}>x{i.cantidad}</Text>
                  <Text style={styles.resumenVal}>
                    $ {(i.producto.valor_unitario * i.cantidad).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalVal}>$ {total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={{ marginTop: 16 }}>
                <PrimaryButton title="Confirmar compra" onPress={confirmarCompra} loading={comprando} />
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  blockIcon: { fontSize: 56, textAlign: 'center' },
  blockTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center' },
  blockMsg: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.muted, textAlign: 'center', lineHeight: 22 },
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
  cartCount: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
  list: { padding: spacing.screen, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 6,
  },
  cardDisabled: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  productName: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  stockBadge: { backgroundColor: '#D4EDDA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockEmpty: { backgroundColor: '#F8D7CF' },
  stockText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  precio: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: colors.primary },
  qtyBtnText: { fontSize: 20, color: colors.primary, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  qtyValue: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, minWidth: 28, textAlign: 'center' },
  resumen: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginTop: 8,
    gap: 8,
  },
  resumenTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 8 },
  resumenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resumenProd: { flex: 1, fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  resumenCant: { fontSize: 13, color: colors.muted, fontFamily: 'Poppins_400Regular', minWidth: 28 },
  resumenVal: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, minWidth: 80, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.text },
  totalVal: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.primary },
});
