import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Seller, SignupData } from '../types';
import {
  getCurrentSeller,
  login as authLogin,
  logout as authLogout,
  seedDemoAccount,
  signup as authSignup,
  updateProfile as authUpdateProfile,
} from '../services/auth';

interface AuthContextValue {
  seller: Seller | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Seller | null;
  signup: (data: SignupData) => Seller;
  logout: () => void;
  updateProfile: (updates: Partial<Seller>) => Seller;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    seedDemoAccount();
    setSeller(getCurrentSeller());
  }, []);

  const login = useCallback((email: string, password: string) => {
    const nextSeller = authLogin(email, password);
    setSeller(nextSeller);
    return nextSeller;
  }, []);

  const signup = useCallback((data: SignupData) => {
    const nextSeller = authSignup(data);
    setSeller(nextSeller);
    return nextSeller;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setSeller(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<Seller>) => {
    const nextSeller = authUpdateProfile(updates);
    setSeller(nextSeller);
    return nextSeller;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      seller,
      isAuthenticated: Boolean(seller),
      login,
      signup,
      logout,
      updateProfile,
    }),
    [login, logout, seller, signup, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
