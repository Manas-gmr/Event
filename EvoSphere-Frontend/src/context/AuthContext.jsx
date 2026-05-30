import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getUser, getToken, saveAuth, clearAuth, authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  useEffect(() => {
    const tokenValue = getToken();
    if (!tokenValue) return;

    authApi.me()
      .then((freshUser) => {
        saveAuth(tokenValue, freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        clearAuth();
        setToken(null);
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    saveAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (body) => {
    const data = await authApi.register(body);
    saveAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
