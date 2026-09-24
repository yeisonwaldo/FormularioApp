import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import type { Producto } from '../../types/db';
import { AuthInput } from '../../components/AuthInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing } from '../../theme';

const EMPTY_FORM = { nombre: '', descripcion: '', valor_unitario: '', stock: '' };

export function ProductosScreen() {
  const insets = useSafeAreaInsets();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    if (error) Alert.alert('Error', error.message);
    else setProductos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const abrirFormNuevo = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const abrirFormEdicion = (p: Producto) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      valor_unitario: String(p.valor_unitario),
      stock: String(p.stock),
    });
    setModalVisible(true);
  };

  const validarForm = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es requerido.';
    const valor = parseFloat(form.valor_unitario);
    if (isNaN(valor) || valor <= 0) return 'El valor unitario debe ser un número mayor a 0.';
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) return 'El stock debe ser un entero mayor o igual a 0.';
    return null;
  };

  const guardar = async () => {
    const err = validarForm();
    if (err) { Alert.alert('Validación', err); return; }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      valor_unitario: parseFloat(form.valor_unitario),
      stock: parseInt(form.stock, 10),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('productos').update(payload as any).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('productos').insert(payload as any));
    }

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setModalVisible(false);
      fetchProductos();
    }
  };

  const eliminar = (id: string, nombre: string) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('productos').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchProductos();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Producto }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
        <View style={[styles.stockBadge, item.stock === 0 && styles.stockEmpty]}>
          <Text style={styles.stockText}>Stock: {item.stock}</Text>
        </View>
      </View>
      {item.descripcion && <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>}
      <Text style={styles.precio}>$ {item.valor_unitario.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.btnEdit} onPress={() => abrirFormEdicion(item)}>
          <Text style={styles.btnEditText}>✏️ Editar</Text>
        </Pressable>
        <Pressable style={styles.btnDelete} onPress={() => eliminar(item.id, item.nombre)}>
          <Text style={styles.btnDeleteText}>🗑 Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Productos</Text>
        <Pressable style={styles.addBtn} onPress={abrirFormNuevo}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay productos. Crea el primero.</Text>
            </View>
          }
        />
      )}

      {/* Modal de formulario */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBox}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar producto' : 'Nuevo producto'}</Text>
              <View style={styles.modalForm}>
                <Text style={styles.label}>Nombre *</Text>
                <AuthInput placeholder="Nombre del producto" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
                <Text style={styles.label}>Descripción</Text>
                <AuthInput placeholder="Descripción (opcional)" value={form.descripcion} onChangeText={(v) => setForm({ ...form, descripcion: v })} />
                <Text style={styles.label}>Valor unitario * ($)</Text>
                <AuthInput placeholder="0.00" value={form.valor_unitario} onChangeText={(v) => setForm({ ...form, valor_unitario: v })} keyboardType="decimal-pad" />
                <Text style={styles.label}>Stock *</Text>
                <AuthInput placeholder="0" value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} keyboardType="number-pad" />
                <View style={{ gap: 10, marginTop: 8 }}>
                  <PrimaryButton title={editingId ? 'Guardar cambios' : 'Crear producto'} onPress={guardar} loading={saving} />
                  <PrimaryButton title="Cancelar" onPress={() => setModalVisible(false)} variant="outline" />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.button,
  },
  addBtnText: { color: colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  list: { padding: spacing.screen, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 6,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productName: { flex: 1, fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginRight: 8 },
  stockBadge: { backgroundColor: '#D4EDDA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockEmpty: { backgroundColor: '#F8D7CF' },
  stockText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  precio: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.primary },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnEdit: {
    flex: 1,
    height: 40,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditText: { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  btnDelete: {
    flex: 1,
    height: 40,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeleteText: { color: colors.error, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.screen,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: colors.muted, fontFamily: 'Poppins_400Regular', fontSize: 15 },
});
