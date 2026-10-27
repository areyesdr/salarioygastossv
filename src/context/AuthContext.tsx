import React, { createContext, useContext, useState, useEffect } from 'react';
import { type SessionUser, type UserRole } from '../lib/security.ts';

interface AuthContextValue {
  user: SessionUser | null;
  loginAs: (role: UserRole, customEmail?: string, customName?: string, cleanSlate?: boolean) => void;
  createCleanUser: (customName?: string, customEmail?: string) => void;
  logout: () => void;
  updateProfile: (name: string, email: string) => void;
  purgeUserDataAndAccount: () => void;
}

const AUTH_STORAGE_KEY = 'salarioygastossv_auth_v1';
const DATA_STORAGE_KEY = 'salarioygastossv_state_v1';

const DEFAULT_USER: SessionUser = {
  id: 'usr-test-01',
  name: 'Usuario Pruebas',
  email: 'test@salariosv.com',
  loggedIn: true,
  role: 'user',
  acceptedTermsAt: '2026-10-26T18:00:00.000Z',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return DEFAULT_USER;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USER;
    }
  });

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
    });
  };

  const createCleanUser = (customName?: string, customEmail?: string) => {
    const id = `usr-test-${Date.now().toString(36)}`;
    try {
      localStorage.removeItem(DATA_STORAGE_KEY);
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
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (name: string, email: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: name.trim() || prev.name,
        email: email.trim() || prev.email,
      };
    });
  };

  const purgeUserDataAndAccount = () => {
    try {
      localStorage.removeItem(DATA_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAs,
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
