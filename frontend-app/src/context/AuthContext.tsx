import { createContext, useContext, useState, ReactNode } from "react";
import api from "../services/api";

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (email: string, password: string, role: "student" | "company") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));

  const login = async (email: string, password: string, role: "student" | "company") => {
    const res = await api.post(`/api/auth/${role}/login`, { email, password });
    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("role", role);
    setToken(res.data.access_token);
    setRole(role);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
