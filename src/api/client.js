/**
 * Axios client
 *  - Access token sirf memory me (localStorage me NAHI -> XSS se chori nahi hota)
 *  - Refresh token httpOnly cookie me (backend set karta hai)
 *  - 401 TOKEN_EXPIRED -> ek hi refresh call (queue), phir original request retry
 */
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

let accessToken = null;
let onLogout = () => {};
let onSession = () => {};
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;
export const bindAuthHandlers = ({ logout, session }) => { onLogout = logout; onSession = session; };

export const api = axios.create({
  baseURL: `${API_URL}/admin`,
  withCredentials: true,
  timeout: 30000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing = null;
export function refreshSession() {
  // Ek time par ek hi refresh — baaki requests isi promise ka wait karti hain
  refreshing ??= axios
    .post(`${API_URL}/admin/auth/refresh`, {}, { withCredentials: true, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then((r) => {
      accessToken = r.data.data.access_token;
      onSession(r.data.data.admin);
      return accessToken;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const res = error.response;
    const cfg = error.config || {};
    const code = res?.data?.error_code;
    if (res?.status === 401 && code === 'TOKEN_EXPIRED' && !cfg._retry) {
      cfg._retry = true;
      try {
        await refreshSession();
        return api(cfg);
      } catch {
        onLogout('Session expire ho gaya, dobara login karein');
      }
    } else if (res?.status === 401 && !cfg.url?.includes('/auth/')) {
      onLogout(code === 'REFRESH_REUSED' ? 'Security ke liye logout kiya gaya' : null);
    }
    return Promise.reject(error);
  },
);

export const errMsg = (e, fallback = 'Something went wrong!') =>
  e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Server se connect nahi ho paya' : e?.message) || fallback;

/** Auth wale binary (PDF / prescription image) ko blob URL me laao */
export async function fetchBlobUrl(path) {
  const r = await api.get(path, { responseType: 'blob' });
  return { url: URL.createObjectURL(r.data), type: r.data.type };
}

export async function uploadImages(files, path = '/products/images') {
  const fd = new FormData();
  [...files].forEach((f) => fd.append(path.endsWith('images') ? 'files' : 'file', f));
  const r = await api.post(path, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data.data;
}
