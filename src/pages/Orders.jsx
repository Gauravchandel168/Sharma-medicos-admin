import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Download, Eye, Package, Printer, Store, Truck, Zap } from 'lucide-react';
import { api, fetchBlobUrl, errMsg } from '../api/client';
import { useFetch } from '../utils/useFetch';
import { DELIVERY, inr, timeAgo } from '../utils/format';
import { Avatar, Badge, Button, Empty, IconBtn, PageHeader, Pagination, SearchInput, Select, StatusBadge, TableSkeleton, Tabs } from '../components/ui';
import toast from 'react-hot-toast';

const TABS = ['all', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
const DICON = { home: Truck, pickup: Store, courier: Package };

export async function openInvoice(id) {
  try { const { url } = await fetchBlobUrl(`/orders/${id}/invoice`); window.open(url, '_blank'); } catch (e) { toast.error(errMsg(e)); }
}

function exportCsv(rows) {
  const head = ['Order', 'Customer', 'Phone', 'Items', 'Amount', 'Payment', 'Delivery', 'Status', 'Date'];
  const lines = rows.map((o) => [o.order_no, o.customer_name, o.customer_phone, o.item_count, o.total, o.payment_status, o.delivery_method, o.status, o.created_at].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function Orders() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState({ page: 1, status: sp.get('status') || 'all', search: sp.get('search') || '', delivery_method: '', payment_status: '', rx: '', from: '', to: '' });
  useEffect(() => { setQ((s) => ({ ...s, search: sp.get('search') || s.search, status: sp.get('status') || s.status })); }, [sp]);
  const clean = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== ''));
  const { data, meta, loading, reload } = useFetch('/orders', clean);
  const set = (k) => (v) => setQ((s) => ({ ...s, [k]: v?.target ? v.target.value : v, page: 1 }));

  // Live: har 30 sec me naye orders
  useEffect(() => { const t = setInterval(() => reload(true), 30000); return () => clearInterval(t); }, [reload]);

  return (
    <>
      <PageHeader title="Orders" subtitle="Sales · Har customer ka har order yahan"
        actions={<Button variant="outline" icon={Download} onClick={() => data && exportCsv(data)}>Export</Button>} />
      <div className="mb-3 overflow-x-auto"><Tabs value={q.status} onChange={set('status')} tabs={TABS.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1), count: meta?.counts?.[t] ?? 0 }))} /></div>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput className="w-[240px]" placeholder="Order ID, customer, phone…" value={q.search} onChange={set('search')} />
        <input type="date" className="input w-[150px]" value={q.from} onChange={set('from')} title="From" />
        <input type="date" className="input w-[150px]" value={q.to} onChange={set('to')} title="To" />
        <Select className="w-[150px]" value={q.delivery_method} onChange={set('delivery_method')} placeholder="Delivery: All" options={Object.entries(DELIVERY).map(([value, label]) => ({ value, label }))} />
        <Select className="w-[150px]" value={q.payment_status} onChange={set('payment_status')} placeholder="Payment: All" options={['paid', 'refunded', 'partially_refunded', 'failed'].map((v) => ({ value: v, label: v.replace('_', ' ') }))} />
        <Select className="w-[120px]" value={q.rx} onChange={set('rx')} placeholder="Rx: All" options={[{ value: 'pending', label: 'Rx pending' }, { value: 'approved', label: 'Rx approved' }, { value: 'rejected', label: 'Rx rejected' }]} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead><tr>{['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Delivery', 'Rx', 'Status', 'Time', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          {loading ? <TableSkeleton cols={10} rows={8} /> : (
            <tbody>
              {data?.map((o, i) => {
                const DI = DICON[o.delivery_method];
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} onClick={() => navigate(`/orders/${o.id}`)} className="cursor-pointer hover:bg-[#F8FBFA]">
                    <td className="td font-bold">{o.order_no}</td>
                    <td className="td"><div className="flex items-center gap-2"><Avatar name={o.customer_name} size={26} /><div><div className="font-semibold">{o.customer_name}</div><div className="text-[11px] text-mut">{o.customer_phone}</div></div></div></td>
                    <td className="td">{o.item_count}</td>
                    <td className="td font-bold">{inr(o.total)}</td>
                    <td className="td"><Badge tone={o.payment_status === 'paid' ? 'ok' : o.payment_status.includes('refund') ? 'blue' : 'bad'}>{o.payment_status.replace('_', ' ')}</Badge><div className="mt-0.5 text-[11px] uppercase text-mut">{o.payment_method || ''}</div></td>
                    <td className="td"><span className="flex items-center gap-1.5 text-[12.5px]"><DI size={14} className="text-mut" />{DELIVERY[o.delivery_method]}</span></td>
                    <td className="td">{o.rx_status === 'pending' ? <Badge tone="warn" icon={Clock}>Review</Badge> : o.rx_status === 'approved' ? <Badge tone="ok" icon={Check}>Verified</Badge> : o.rx_status === 'rejected' ? <Badge tone="bad">Rejected</Badge> : <span className="text-mut">—</span>}</td>
                    <td className="td"><StatusBadge status={o.status} label={o.status_label} /></td>
                    <td className="td text-[12px] text-mut">{timeAgo(o.created_at)}</td>
                    <td className="td" onClick={(e) => e.stopPropagation()}><div className="flex gap-1.5"><IconBtn icon={Eye} onClick={() => navigate(`/orders/${o.id}`)} />{o.payment_status !== 'failed' && <IconBtn icon={Printer} title="Invoice" onClick={() => openInvoice(o.id)} />}</div></td>
                  </motion.tr>
                );
              })}
              {!data?.length && <tr><td colSpan={10}><Empty icon={Package} title="Koi order nahi" subtitle="Filters badal kar dekhein" /></td></tr>}
            </tbody>
          )}
        </table>
        <Pagination meta={meta} onPage={(page) => setQ({ ...q, page })} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-mut"><Zap size={12} className="text-p-light" />List har 30 second me auto-refresh hoti hai. Order par click karke status badlein.</p>
    </>
  );
}
