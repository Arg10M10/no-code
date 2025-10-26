import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(() => {
    const storedUser = localStorage.getItem("app_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  const login = (email: string) => {
    const newUser: User = { id: "user-123", email };
    setUser(newUser);
    localStorage.setItem("app_user", JSON.stringify(newUser));
    toast.success("Sesión iniciada.");
    navigate("/editor");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
    toast.info("Sesión cerrada.");
    navigate("/login");
  };

  const value = React.useMemo(() => ({ user, login, logout }), [user, navigate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};