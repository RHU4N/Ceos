// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const logoutTimerRef = useRef(null);
  

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('ceos_user', JSON.stringify(userData));
    localStorage.setItem('ceos_token', token);
    // decode token and schedule logout at expiry
    try {
      const decoded = jwtDecode(token);
      if (decoded && decoded.exp) {
        const expiresAt = decoded.exp * 1000;
        const now = Date.now();
        const ms = Math.max(0, expiresAt - now);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = setTimeout(() => {
          handleLogout();
        }, ms);
      }
    } catch (err) {
      // ignore decode errors
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ceos_user');
    localStorage.removeItem('ceos_token');
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    // navigate to login page
    try {
      // AuthProvider may be mounted above Router. Use window.location to ensure redirect works.
      window.location.href = '/login';
    } catch (e) {
      // navigate may not be available in some test environments
    }
  }, []);

  const logout = () => handleLogout();

  // Carrega usuário/token do localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('ceos_user');
    const storedToken = localStorage.getItem('ceos_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // schedule logout if token already expired or close to expiry
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded && decoded.exp) {
          const expiresAt = decoded.exp * 1000; // exp is in seconds
          const now = Date.now();
          if (expiresAt <= now) {
            // token expired
            localStorage.removeItem('ceos_user');
            localStorage.removeItem('ceos_token');
            setUser(null);
            setToken(null);
          } else {
            // schedule logout
            const ms = expiresAt - now;
            logoutTimerRef.current = setTimeout(() => {
              handleLogout();
            }, ms);
          }
        }
      } catch (err) {
        // invalid token — clear
        localStorage.removeItem('ceos_user');
        localStorage.removeItem('ceos_token');
        setUser(null);
        setToken(null);
      }
    }
  }, [handleLogout]);

  // Listen for historico updates emitted elsewhere in the app and sync into context
  useEffect(() => {
    function onHistoricoUpdate(e) {
      try {
        const latest = e && e.detail ? e.detail : null;
        if (!latest) return;
        setUser(prev => {
          if (!prev) return prev;
          const next = { ...prev, historico: latest };
          try { localStorage.setItem('ceos_user', JSON.stringify(next)); } catch (err) {}
          return next;
        });
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('ceos:historicoUpdated', onHistoricoUpdate);
    return () => window.removeEventListener('ceos:historicoUpdated', onHistoricoUpdate);
  }, []);

  // attach axios interceptor to logout on 401 unauthorized
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error && error.response && error.response.status;
        if (status === 401) {
          // force logout when server says unauthorized
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleLogout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
