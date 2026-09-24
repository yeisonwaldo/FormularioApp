import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import type { Cliente } from '../../types/db';
import { AuthInput } from '../../components/AuthInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing } from '../../theme';

export function PerfilClienteScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '' });
  const [modoEdicion, setModoEdicion] = useState(false);

  const fetchCliente = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', user.id)
      .single();
    setCliente((data as any) ?? null);
    if (data) {
      const d = data as any;
      setForm({ nombre: d.nombre, apellido: d.apellido, correo: d.correo });
    } else {
      // Primer ingreso: modo edición automático con correo pre-llenado
      setForm({ nombre: '', apellido: '', correo: user.email ?? '' });
      setModoEdicion(true);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCliente(); }, [fetchCliente]);

  const validar = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es requerido.';
    if (!form.apellido.trim()) return 'El apellido es requerido.';
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) return 'Ingresa un correo válido.';
    return null;
  };

  const guardar = async () => {
    const err = validar();
    if (err) { Alert.alert('Validación', err); return; }
    if (!user) return;

    setSaving(true);
    const payload = {
      id: user.id,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim().toLowerCase(),
    };

    const { error } = cliente
      ? await supabase.from('clientes').update(payload as any).eq('id', user.id)
      : await supabase.from('clientes').insert(payload as any);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Listo!', 'Datos guardados correctamente.');
      setModoEdicion(false);
      fetchCliente();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(form.nombre || '?').charAt(0).toUpperCase()}
              {(form.apellido || '').charAt(0).toUpperCase()}
            </Text>
          </View>
          {!cliente && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Completa tu perfil antes de realizar compras.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Datos personales</Text>

        {modoEdicion ? (
          <View style={styles.form}>
            <Text style={styles.label}>Nombre *</Text>
            <AuthInput placeholder="Tu nombre" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
            <Text style={styles.label}>Apellido *</Text>
            <AuthInput placeholder="Tu apellido" value={form.apellido} onChangeText={(v) => setForm({ ...form, apellido: v })} />
            <Text style={styles.label}>Correo electrónico *</Text>
            <AuthInput
              placeholder="correo@ejemplo.com"
              value={form.correo}
              onChangeText={(v) => setForm({ ...form, correo: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ gap: 10, marginTop: 8 }}>
              <PrimaryButton title="Guardar datos" onPress={guardar} loading={saving} />
              {cliente && (
                <PrimaryButton title="Cancelar" onPress={() => { setModoEdicion(false); fetchCliente(); }} variant="outline" />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <InfoRow label="Nombre" value={`${cliente?.nombre} ${cliente?.apellido}`} />
            <InfoRow label="Correo" value={cliente?.correo ?? ''} />
            <InfoRow label="Fecha de registro" value={cliente ? new Date(cliente.fecha).toLocaleDateString('es-CO') : ''} />
            <View style={{ marginTop: 16, gap: 10 }}>
              <PrimaryButton title="✏️ Editar perfil" onPress={() => setModoEdicion(true)} variant="outline" />
              <Pressable
                onPress={() => {
                  Alert.alert('Cerrar sesión', '¿Deseas salir?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
                  ]);
                }}
                style={styles.logoutBtn}
              >
                <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.screen, flexGrow: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 24, gap: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 28 },
  warningBox: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FFEAA0',
  },
  warningText: { color: '#856404', fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 16,
  },
  form: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 12,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    paddingBottom: 10,
  },
  infoLabel: { fontSize: 12, color: colors.muted, fontFamily: 'Poppins_400Regular' },
  infoValue: { fontSize: 15, color: colors.text, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
});
