import { createContext, useContext, useState, ReactNode } from "react";
import api from "../services/api";

/** Backend roles: student | admin. UI may label admin as "Company". */
type Role = "student" | "admin";

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));

  const login = async (email: string, password: string, role: Role) => {
    const endpoint = `/api/auth/${role}/login`;
    const res = await api.post(endpoint, { email, password });
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
