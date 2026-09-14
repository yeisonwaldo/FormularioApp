import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { AppUser, authenticate, registerUser } from './users';

type AuthContextValue = {
  user: AppUser | null;
  signIn: (email: string, password: string) => string | null;
  signUp: (email: string, password: string) => string | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: (email, password) => {
        const found = authenticate(email, password);
        if (!found) {
          return 'Correo o contraseña incorrectos.';
        }
        setUser(found);
        return null;
      },
      signUp: (email, password) => {
        const result = registerUser({
          email,
          password,
          name: email.split('@')[0],
        });
        if (!result.ok) {
          return result.message;
        }
        const found = authenticate(email, password);
        if (found) {
          setUser(found);
        }
        return null;
      },
      signOut: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
