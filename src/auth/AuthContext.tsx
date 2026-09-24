import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Perfil } from '../types/db';

type AuthContextValue = {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Error fetching perfil:', error.message);
    }
    setPerfil(data ?? null);
  }, []);

  // Inicializar sesión al arrancar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchPerfil(session.user.id);
        } else {
          setPerfil(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchPerfil]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      perfil,
      loading,
      refreshPerfil: () => (user ? fetchPerfil(user.id) : Promise.resolve()),
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            return 'Correo o contraseña incorrectos.';
          }
          return error.message;
        }
        return null;
      },
      signUp: async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              email: cleanEmail,
            },
          },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            return 'Ya existe una cuenta con este correo.';
          }
          if (error.message.toLowerCase().includes('rate limit')) {
            return 'Supabase ha bloqueado temporalmente el envío de correos por demasiados intentos. Por favor espera 2 o 3 minutos e inténtalo de nuevo.';
          }
          return error.message;
        }

        // Si se creó el usuario en Supabase Auth, aseguramos guardar el email en el perfil
        if (data?.user) {
          try {
            await supabase
              .from('perfiles')
              .upsert({
                id: data.user.id,
                email: cleanEmail,
                estado: 'pendiente',
                rol: 'cliente',
              } as any);
          } catch {
            // Si la columna email aún no existe o el trigger ya lo manejó, continúa sin bloquear el flujo
          }
        }
        return null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setUser(null);
        setPerfil(null);
      },
    }),
    [user, perfil, loading, fetchPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
