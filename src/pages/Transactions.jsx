import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, IndianRupee, RefreshCw, XCircle, Download } from 'lucide-react';
import { useFetch } from '../utils/useFetch';
import { dt, inr } from '../utils/format';
import { Avatar, Badge, Button, Card, Empty, Kpi, PageHeader, Pagination, SearchInput, TableSkeleton, Tabs } from '../components/ui';

export const TxStatus = ({ t }) => {
  if (t.type === 'refund') return <Badge tone="blue">{t.status === 'pending' ? 'Refund pending' : 'Refunded'}</Badge>;
  return <Badge tone={t.status === 'success' ? 'ok' : t.status === 'failed' ? 'bad' : 'warn'}>{t.status === 'success' ? 'Success' : t.status === 'failed' ? 'Failed' : 'Pending'}</Badge>;
};
const MCOLORS = { upi: '#0F5F57', card: '#2F6FEB', netbanking: '#D98A06', wallet: '#C9306E', other: '#B7C3C1' };

export default function Transactions() {
  const navigate = useNavigate();
  const [q, setQ] = useState({ page: 1, status: 'all', search: '', from: '', to: '' });
  const { data, meta, loading } = useFetch('/transactions', Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '')));
  const s = meta?.summary;
  const csv = () => {
    const rows = [['Payment ID', 'Order', 'Customer', 'Type', 'Method', 'Amount', 'Status', 'Date'], ...(data || []).map((t) => [t.razorpay_payment_id, t.order_no, t.customer_name, t.type, t.method, t.amount, t.status, t.created_at])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'transactions.csv';
    a.click();
  };
  return (
    <>
      <PageHeader title="Transactions" subtitle="Razorpay payments, refunds aur failed payments" actions={<Button variant="outline" icon={Download} onClick={csv}>Export</Button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi loading={!s} icon={IndianRupee} tone="ok" label="Collected today" value={s && inr(s.today.collected)} sub={s && `${s.today.payments} payments`} />
        <Kpi loading={!s} icon={RefreshCw} tone="blue" label="Refunds today" value={s && inr(s.today.refunded)} sub={s && `${s.today.refunds} refunds`} down />
        <Kpi loading={!s} icon={XCircle} tone="bad" label="Failed payments" value={s?.today.failed} sub="Aaj" down />
        <Kpi loading={!s} icon={CalendarClock} tone="vio" label="Settlement" value="T+2" sub="Razorpay dashboard me dekhein" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px]">
        <Card noPad title={<Tabs value={q.status} onChange={(v) => setQ({ ...q, status: v, page: 1 })} tabs={[{ value: 'all', label: 'All' }, { value: 'success', label: 'Success' }, { value: 'refunded', label: 'Refunds' }, { value: 'failed', label: 'Failed' }]} />}
          actions={<div className="flex gap-2"><SearchInput className="w-[200px]" placeholder="Order / payment ID…" value={q.search} onChange={(v) => setQ({ ...q, search: v, page: 1 })} />
            <input type="date" className="input w-[140px]" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value, page: 1 })} /></div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr>{['Payment ID', 'Order', 'Customer', 'Method', 'Amount', 'Status', 'Time'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              {loading ? <TableSkeleton cols={7} rows={8} /> : <tbody>
                {data?.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} onClick={() => navigate(`/orders/${t.order_id}`)} className="cursor-pointer hover:bg-[#F8FBFA]">
                    <td className="td font-mono text-[12px]">{t.type === 'refund' ? t.razorpay_refund_id : t.razorpay_payment_id || t.razorpay_order_id}</td>
                    <td className="td font-bold">{t.order_no}</td>
                    <td className="td"><div className="flex items-center gap-2"><Avatar name={t.customer_name} size={24} />{t.customer_name}</div></td>
                    <td className="td text-mut"><span className="uppercase">{t.method || '—'}</span> {t.method_detail}</td>
                    <td className={`td font-bold ${t.type === 'refund' ? 'text-blue' : ''}`}>{t.type === 'refund' ? '−' : ''}{inr(t.amount, 2)}</td>
                    <td className="td"><TxStatus t={t} /></td>
                    <td className="td text-[12px] text-mut">{dt(t.created_at)}</td>
                  </motion.tr>
                ))}
                {!data?.length && <tr><td colSpan={7}><Empty title="Koi transaction nahi" /></td></tr>}
              </tbody>}
            </table>
          </div>
          <Pagination meta={meta} onPage={(page) => setQ({ ...q, page })} />
        </Card>
        <Card title="Payment methods" actions={<span className="text-[11.5px] text-mut">30 days</span>}>
          {(s?.methods || []).map((m) => (
            <div key={m.method} className="mb-3">
              <div className="flex justify-between text-[12.5px]"><span className="uppercase">{m.method}</span><b>{m.percent}%</b></div>
              <div className="mt-1 h-2 rounded-full bg-[#EEF2F1]"><motion.div initial={{ width: 0 }} animate={{ width: `${m.percent}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: MCOLORS[m.method] || MCOLORS.other }} /></div>
            </div>
          ))}
          {!s?.methods?.length && <Empty title="Abhi data nahi" />}
          <p className="mt-2 text-[11.5px] text-mut">Refund order page se karein (Orders → order → Refund).</p>
        </Card>
      </div>
    </>
  );
}
