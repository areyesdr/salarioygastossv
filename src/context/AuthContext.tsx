import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type SessionUser, type UserRole } from '../lib/security.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

interface AuthContextValue {
  user: SessionUser | null;
  isAuthReady: boolean;
  isSupabaseConnected: boolean;
  loginAs: (role: UserRole, customEmail?: string, customName?: string, cleanSlate?: boolean) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithCredentials: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  createCleanUser: (customName?: string, customEmail?: string) => void;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  purgeUserDataAndAccount: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'salarioygastossv_auth_v1';
const DATA_STORAGE_KEY = 'salarioygastossv_state_v1';
const LEDGERS_STORAGE_KEY = 'salarioygastossv_ledgers_v1';

// Límite de inactividad de sesión: 1 hora (3600 segundos)
const SESSION_INACTIVITY_LIMIT_MS = 60 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState<boolean>(!isSupabaseConfigured);
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed: SessionUser = JSON.parse(raw);
      if (!parsed || !parsed.loggedIn) return null;

      // Verificar si la sesión guardada expiró por inactividad
      if (parsed.lastActiveAt && Date.now() - parsed.lastActiveAt > SESSION_INACTIVITY_LIMIT_MS) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return {
        ...parsed,
        lastActiveAt: Date.now(),
      };
    } catch {
      return null;
    }
  });

  const syncSupabaseUser = useCallback((authUser: any) => {
    const metaName =
      authUser.user_metadata?.name ||
      authUser.user_metadata?.full_name ||
      (authUser.email ? authUser.email.split('@')[0] : 'Usuario');

    const role: UserRole = authUser.user_metadata?.role === 'admin' ? 'admin' : 'user';

    setUser({
      id: authUser.id,
      name: metaName,
      email: authUser.email || '',
      loggedIn: true,
      role,
      acceptedTermsAt: authUser.created_at || new Date().toISOString(),
      lastActiveAt: Date.now(),
    });
  }, []);

  // Sincronización con sesión activa de Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          syncSupabaseUser(session.user);
        } else {
          // Si Supabase no tiene sesión activa, asegurarse de que no quede sesión residual
          setUser((prev) => (prev?.id.startsWith('usr-') ? prev : null));
        }
        setIsAuthReady(true);
      })
      .catch(() => {
        setIsAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        syncSupabaseUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSupabaseUser]);

  // Persistir cambios de usuario en localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  // Detector de actividad y expiración por inactividad
  useEffect(() => {
    if (!user) return;

    const recordActivity = () => {
      setUser((prev) => {
        if (!prev) return null;
        // Throttle: no re-renderizar si hubo actividad hace menos de 30 segundos
        if (prev.lastActiveAt && Date.now() - prev.lastActiveAt < 30_000) {
          return prev;
        }
        return {
          ...prev,
          lastActiveAt: Date.now(),
        };
      });
    };

    // Revisa periódicamente si se excedió el tiempo límite
    const interval = setInterval(() => {
      setUser((current) => {
        if (!current?.lastActiveAt) return current;
        if (Date.now() - current.lastActiveAt > SESSION_INACTIVITY_LIMIT_MS) {
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            if (isSupabaseConfigured) {
              supabase.auth.signOut().catch(() => {});
            }
          } catch {
            // ignore
          }
          return null;
        }
        return current;
      });
    }, 30_000);

    window.addEventListener('click', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity, { passive: true });
    window.addEventListener('scroll', recordActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('scroll', recordActivity);
    };
  }, [user]);

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      loginAs('user', email, email.split('@')[0]);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        syncSupabaseUser(data.user);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error de conexión con Supabase' };
    }
  };

  const registerWithCredentials = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      loginAs('user', email, name, true);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            role: 'user',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        syncSupabaseUser(data.user);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al registrar en Supabase' };
    }
  };

  const loginAs = (
    role: UserRole,
    customEmail?: string,
    customName?: string,
    cleanSlate: boolean = false
  ) => {
    let id: string;
    if (role === 'admin') {
      id = 'usr-admin-01';
    } else if (cleanSlate || (customEmail && customEmail.toLowerCase() !== 'usuario@salariosv.com')) {
      id = `usr-test-${Date.now().toString(36)}`;
    } else {
      id = 'usr-sv-01';
    }

    if (cleanSlate) {
      try {
        localStorage.removeItem(DATA_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    setUser({
      id,
      name: customName?.trim() || (role === 'admin' ? 'Administrador SV' : 'Usuario Pruebas'),
      email: customEmail?.trim() || (role === 'admin' ? 'admin@salariosv.com' : 'test@salariosv.com'),
      loggedIn: true,
      role,
      acceptedTermsAt: new Date().toISOString(),
      lastActiveAt: Date.now(),
    });
  };

  const createCleanUser = (customName?: string, customEmail?: string) => {
    const id = `usr-test-${Date.now().toString(36)}`;
    try {
      localStorage.removeItem(DATA_STORAGE_KEY);
      localStorage.removeItem(LEDGERS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser({
      id,
      name: customName?.trim() || 'Usuario Pruebas',
      email: customEmail?.trim() || 'test@salariosv.com',
      loggedIn: true,
      role: 'user',
      acceptedTermsAt: new Date().toISOString(),
      lastActiveAt: Date.now(),
    });
  };

  const logout = async () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    setUser(null);
  };

  const updateProfile = async (name: string, email: string) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (isSupabaseConfigured && user) {
      try {
        await supabase.auth.updateUser({
          email: trimmedEmail || undefined,
          data: { name: trimmedName },
        });

        await supabase
          .from('profiles')
          .update({ name: trimmedName, email: trimmedEmail, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch {
        // ignore
      }
    }

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: trimmedName || prev.name,
        email: trimmedEmail || prev.email,
        lastActiveAt: Date.now(),
      };
    });
  };

  const purgeUserDataAndAccount = async () => {
    try {
      localStorage.removeItem(DATA_STORAGE_KEY);
      localStorage.removeItem(LEDGERS_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        isSupabaseConnected: isSupabaseConfigured,
        loginAs,
        loginWithCredentials,
        registerWithCredentials,
        createCleanUser,
        logout,
        updateProfile,
        purgeUserDataAndAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}
