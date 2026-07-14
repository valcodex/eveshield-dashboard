import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api, setAccessToken } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, attempt a silent refresh using the httpOnly cookie so a
  // page reload doesn't force the operator to log in again.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/auth/refresh");
        const token = res.data?.data?.accessToken as string;
        setAccessToken(token);
        const me = await api.get("/auth/me");
        setUser(me.data.data);
        connectSocket(token);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => disconnectSocket();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user: loggedInUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    connectSocket(accessToken);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    disconnectSocket();
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
