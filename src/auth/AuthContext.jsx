import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { api, API_URL, bindAuthHandlers, getAccessToken, refreshSession, setAccessToken } from '../api/client';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(true);

  const logoutLocal = useCallback((msg) => {
    setAccessToken(null);
    setAdmin(null);
    if (msg) toast.error(msg);
  }, []);

  useEffect(() => {
    bindAuthHandlers({ logout: logoutLocal, session: setAdmin });
    // Page reload par cookie se session wapas lao
    refreshSession().catch(() => {}).finally(() => setBooting(false));
    // Access token expire hone se pehle silently refresh (13 min)
    const t = setInterval(() => { if (getAccessToken()) refreshSession().catch(() => {}); }, 13 * 60 * 1000);
    return () => clearInterval(t);
  }, [logoutLocal]);

  const login = async (email, password, loginAs) => {
    const r = await axios.post(`${API_URL}/admin/auth/login`, { email, password, login_as: loginAs }, { withCredentials: true });
    setAccessToken(r.data.data.access_token);
    setAdmin(r.data.data.admin);
    return r.data.data.admin;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logoutLocal();
  };

  const can = useCallback(
    (module, action = 'view') => !!admin && (admin.is_super_admin || (admin.permissions?.[module] || []).includes(action)),
    [admin],
  );

  const value = useMemo(() => ({ admin, setAdmin, booting, login, logout, can }), [admin, booting, can]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
