import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../infrastructure/api/apiClient";

const AuthContext = createContext();
const apiUrl = process.env.REACT_APP_API_LOGIN_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const sessionVersion = useRef(0);

  const clearSession = useCallback(() => {
    sessionVersion.current++;
    setUser(null);
    localStorage.removeItem("ceos_user");
  }, []);

  const login = useCallback((userData) => {
    sessionVersion.current++;
    setUser(userData);
    localStorage.setItem("ceos_user", JSON.stringify(userData));
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("ceos_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    sessionVersion.current++;
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
    const version = sessionVersion.current;

    async function restoreSession() {
      try {
        const response = await apiClient.get(`${apiUrl}/auth/me`);
        if (!active || version !== sessionVersion.current) return;
        const currentUser = response.data.data;
        setUser(currentUser);
        localStorage.setItem("ceos_user", JSON.stringify(currentUser));
      } catch (_error) {
        if (active && version === sessionVersion.current) clearSession();
      }
    }

    restoreSession();
    return () => { active = false; };
  }, [clearSession]);

  // Mantém a cópia usada pela interface sincronizada, embora o histórico seja
  // persistido na collection historicos e não dentro do documento users.
  useEffect(() => {
    function onHistoricoUpdate(event) {
      const historico = Array.isArray(event.detail) ? event.detail : [];
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        const updatedUser = { ...currentUser, historico };
        localStorage.setItem("ceos_user", JSON.stringify(updatedUser));
        return updatedUser;
      });
    }

    window.addEventListener("ceos:historicoUpdated", onHistoricoUpdate);
    return () => window.removeEventListener("ceos:historicoUpdated", onHistoricoUpdate);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
