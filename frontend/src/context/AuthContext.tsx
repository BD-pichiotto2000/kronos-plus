import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi, User } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kronos_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem("kronos_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem("kronos_token", t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem("kronos_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
