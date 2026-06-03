import { createContext, useContext, useEffect, useState } from "react";

import { api } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/storage";

interface AdminProfile {
  id: number;
  username: string;
  created_at: string;
}

interface AuthContextValue {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.getAdminMe();
      setAdmin(profile);
    } catch {
      clearToken();
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await api.adminLogin({ username, password });
    setToken(result.access_token);
    await refresh();
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
