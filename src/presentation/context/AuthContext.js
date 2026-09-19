import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "../../infrastructure/api/apiClient";

const AuthContext = createContext();
const apiUrl = process.env.REACT_APP_API_LOGIN_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ceos_user");
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("ceos_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post(`${apiUrl}/auth/logout`);
    } catch (_error) {
      // Limpa a sessão local mesmo se o JWT já tiver expirado.
    }
    clearSession();
    window.location.href = "/login";
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await apiClient.get(`${apiUrl}/auth/me`);
        if (!active) return;
        const currentUser = response.data.data;
        setUser(currentUser);
        localStorage.setItem("ceos_user", JSON.stringify(currentUser));
      } catch (_error) {
        if (active) clearSession();
      }
    }

    restoreSession();
    return () => { active = false; };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
