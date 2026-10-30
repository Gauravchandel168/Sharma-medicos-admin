import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../api/client';

/** GET + loading/error/meta + reload. params change hone par auto refetch */
export function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(params || {});
  const seq = useRef(0);

  const load = useCallback(async (silent) => {
    if (!url) return;
    const s = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const r = await api.get(url, { params: JSON.parse(key) });
      if (s !== seq.current) return;
      setData(r.data.data);
      setMeta(r.data.meta);
      setError(null);
    } catch (e) {
      if (s === seq.current) setError(errMsg(e));
    } finally {
      if (s === seq.current) setLoading(false);
    }
  }, [url, key]);

  useEffect(() => { load(); }, [load]);
  return { data, meta, loading, error, reload: load, setData };
}

/** Mutation helper: toast + loading */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async (fn, { success, error } = {}) => {
    setBusy(true);
    try {
      const r = await fn();
      const msg = success === undefined ? r?.data?.message : success;
      if (msg) toast.success(msg);
      return r?.data?.data ?? true;
    } catch (e) {
      toast.error(error || errMsg(e));
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}
