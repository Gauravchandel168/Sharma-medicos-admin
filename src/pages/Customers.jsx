import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IndianRupee, Mail, RefreshCw, Users, Zap, Download } from 'lucide-react';
import { useFetch } from '../utils/useFetch';
import { inr, timeAgo } from '../utils/format';
import { Avatar, Badge, Button, Empty, Kpi, PageHeader, Pagination, SearchInput, Select, TableSkeleton } from '../components/ui';

export const ProviderBadge = ({ p }) => (
  <span className="inline-flex items-center gap-1.5 text-[12.5px]">
    {p === 'apple' ? <span className="grid h-4 w-4 place-items-center rounded bg-black text-[9px] text-white"></span>
      : <svg width="13" height="13" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>}
    {p === 'apple' ? 'Apple' : p === 'google' ? 'Google' : 'Dev'}
  </span>
);

export default function Customers() {
  const navigate = useNavigate();
  const [q, setQ] = useState({ page: 1, search: '', provider: '', status: 'all', sort: 'recent' });
  const { data, meta, loading } = useFetch('/customers', Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '')));
  const k = meta?.kpi;
  const set = (key) => (v) => setQ((s) => ({ ...s, [key]: v?.target ? v.target.value : v, page: 1 }));
  const csv = () => {
    const rows = [['Name', 'Email', 'Phone', 'City', 'Pincode', 'Orders', 'Spent', 'Login'], ...(data || []).map((u) => [u.name, u.email, u.phone, u.city, u.pincode, u.orders_count, u.total_spent, u.provider])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'customers.csv';
    a.click();
  };
  return (
    <>
      <PageHeader title="Customers" subtitle="Sales · Saare app users" actions={<Button variant="outline" icon={Download} onClick={csv}>Export CSV</Button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi loading={!k} icon={Users} label="Total customers" value={k?.total} sub={k && `▲ ${k.new_this_month} this month`} />
        <Kpi loading={!k} icon={Zap} tone="blue" label="Active (30 days)" value={k?.active_30d} sub={k && `${k.total ? Math.round((k.active_30d / k.total) * 100) : 0}% of total`} />
        <Kpi loading={!k} icon={IndianRupee} tone="ok" label="Avg. order value" value={k && inr(k.avg_order_value)} />
        <Kpi loading={!k} icon={RefreshCw} tone="vio" label="Repeat customers" value={k && `${k.repeat_rate}%`} sub="2+ orders" />
      </div>
      <div className="my-3 flex flex-wrap gap-2">
        <SearchInput className="w-[260px]" placeholder="Name, phone, email, pincode…" value={q.search} onChange={set('search')} />
        <Select className="w-[130px]" value={q.provider} onChange={set('provider')} placeholder="Login: All" options={[{ value: 'google', label: 'Google' }, { value: 'apple', label: 'Apple' }]} />
        <Select className="w-[130px]" value={q.status} onChange={set('status')} options={[{ value: 'all', label: 'Status: All' }, { value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} />
        <Select className="w-[150px]" value={q.sort} onChange={set('sort')} options={[{ value: 'recent', label: 'Sort: Recent' }, { value: 'spent', label: 'Top spenders' }, { value: 'orders', label: 'Most orders' }]} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead><tr>{['Customer', 'Phone', 'City · Pincode', 'Orders', 'Total spent', 'Last order', 'Login', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          {loading ? <TableSkeleton cols={8} rows={8} /> : (
            <tbody>
              {data?.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} onClick={() => navigate(`/customers/${u.id}`)} className="cursor-pointer hover:bg-[#F8FBFA]">
                  <td className="td"><div className="flex items-center gap-2.5"><Avatar name={u.name || u.email} size={30} /><div><div className="font-semibold">{u.name || '—'}</div><div className="flex items-center gap-1 text-[11.5px] text-mut"><Mail size={11} />{u.email}</div></div></div></td>
                  <td className="td">{u.phone ? `${u.country_code} ${u.phone}` : <span className="text-mut">—</span>}</td>
                  <td className="td text-mut">{[u.city, u.pincode].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="td">{u.orders_count}</td>
                  <td className="td font-bold">{inr(u.total_spent)}</td>
                  <td className="td text-mut">{u.last_order_at ? timeAgo(u.last_order_at) : '—'}</td>
                  <td className="td"><ProviderBadge p={u.provider} /></td>
                  <td className="td"><Badge tone={u.is_blocked ? 'bad' : 'ok'}>{u.is_blocked ? 'Blocked' : 'Active'}</Badge></td>
                </motion.tr>
              ))}
              {!data?.length && <tr><td colSpan={8}><Empty icon={Users} title="Koi customer nahi mila" /></td></tr>}
            </tbody>
          )}
        </table>
        <Pagination meta={meta} onPage={(page) => setQ({ ...q, page })} />
      </div>
    </>
  );
}
