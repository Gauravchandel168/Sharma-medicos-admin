import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Home, Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { DELIVERY, dateOnly, dt, inr } from '../utils/format';
import { Avatar, Badge, Button, Card, Confirm, Empty, IconBtn, PageHeader, Pagination, Select, Shimmer, StatusBadge, TableSkeleton, Tabs } from '../components/ui';
import { ProviderBadge } from './Customers';
import { TxStatus } from './Transactions';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data: u, loading, reload } = useFetch(`/customers/${id}`);
  const [tab, setTab] = useState('orders');
  const [op, setOp] = useState(1);
  const [tp, setTp] = useState({ page: 1, status: 'all' });
  const orders = useFetch(`/customers/${id}/orders`, { page: op });
  const tx = useFetch(can('transactions') ? `/customers/${id}/transactions` : null, tp);
  const [block, setBlock] = useState(false);
  const { busy, run } = useAction();

  if (loading || !u) return <div className="grid gap-4 lg:grid-cols-[280px_1fr]"><Shimmer className="h-[480px]" /><Shimmer className="h-[480px]" /></div>;

  return (
    <>
      <PageHeader back={<IconBtn icon={ArrowLeft} onClick={() => navigate('/customers')} />} title="Customer profile" subtitle={`Sales · Customers · ${u.name || u.email}`} />
      <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
        <div className="card flex flex-col p-5">
          <div className="text-center">
            <Avatar name={u.name || u.email} size={68} className="mx-auto" />
            <div className="mt-3 font-display text-[18px] font-extrabold">{u.name || '—'}</div>
            <div className="text-[12px] text-mut">Customer since {dateOnly(u.created_at)}</div>
            <div className="mt-2 flex justify-center gap-2"><Badge tone={u.is_blocked ? 'bad' : 'ok'}>{u.is_blocked ? 'Blocked' : 'Active'}</Badge><Badge tone="mut"><ProviderBadge p={u.provider} /></Badge></div>
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="space-y-2.5 text-[13px]">
            <div className="flex gap-2.5"><Phone size={15} className="text-mut" />{u.phone ? `${u.country_code} ${u.phone}` : '—'}</div>
            <div className="flex gap-2.5"><Mail size={15} className="text-mut" /><span className="break-all">{u.email || '—'}</span></div>
            {u.addresses.slice(0, 2).map((a) => (
              <div key={a.id} className="flex gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-mut" /><span>{a.flat_house}, {a.area_street}, {a.city} – {a.pincode} {a.is_default ? <Badge tone="p" className="ml-1">Default</Badge> : null}</span></div>
            ))}
            {u.addresses.length > 2 && <div className="flex gap-2.5 text-mut"><Home size={15} />+{u.addresses.length - 2} more addresses</div>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[[u.stats.orders, 'Orders'], [inr(u.stats.total_spent), 'Total spent'], [inr(u.stats.refunded), 'Refunded', 'text-blue'], [inr(u.stats.avg_order), 'Avg. order']].map(([v, l, c]) => (
              <div key={l} className="rounded-xl bg-bg p-2.5"><div className={`font-display text-[16px] font-extrabold ${c || ''}`}>{v}</div><div className="text-[11px] text-mut">{l}</div></div>
            ))}
          </div>
          <div className="mt-auto flex gap-2 pt-5">
            {can('notifications', 'create') && <Button className="flex-1" variant="outline" icon={Send} onClick={() => navigate(`/notifications?user=${u.id}&name=${encodeURIComponent(u.name || '')}`)}>Notify</Button>}
            {can('customers', 'edit') && <Button className="flex-1" variant={u.is_blocked ? 'outline' : 'danger'} icon={u.is_blocked ? CheckCircle2 : Ban} onClick={() => setBlock(true)}>{u.is_blocked ? 'Unblock' : 'Block'}</Button>}
          </div>
        </div>

        <div>
          <Tabs className="mb-3" value={tab} onChange={setTab} tabs={[{ value: 'orders', label: 'Order history', count: u.stats.orders }, ...(can('transactions') ? [{ value: 'tx', label: 'Transaction history' }] : []), { value: 'addresses', label: 'Addresses', count: u.addresses.length }]} />
          {tab === 'orders' && (
            <Card noPad>
              <table className="w-full">
                <thead><tr>{['Order', 'Date', 'Items', 'Amount', 'Status', 'Delivery'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                {orders.loading ? <TableSkeleton cols={6} /> : <tbody>
                  {orders.data?.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="cursor-pointer hover:bg-[#F8FBFA]">
                      <td className="td font-bold">{o.order_no}</td><td className="td text-mut">{dt(o.created_at)}</td><td className="td">{o.item_count}</td>
                      <td className="td font-bold">{inr(o.total)}</td><td className="td"><StatusBadge status={o.status} label={o.status_label} /></td><td className="td text-mut">{DELIVERY[o.delivery_method]}</td>
                    </tr>
                  ))}
                  {!orders.data?.length && <tr><td colSpan={6}><Empty title="Abhi koi order nahi" /></td></tr>}
                </tbody>}
              </table>
              <Pagination meta={orders.meta} onPage={setOp} />
            </Card>
          )}
          {tab === 'tx' && (
            <Card noPad title="Transaction history" actions={<Select className="w-[130px]" value={tp.status} onChange={(e) => setTp({ page: 1, status: e.target.value })} options={[{ value: 'all', label: 'All' }, { value: 'success', label: 'Success' }, { value: 'refunded', label: 'Refunds' }, { value: 'failed', label: 'Failed' }]} />}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead><tr>{['Razorpay ID', 'Order', 'Method', 'Amount', 'Status', 'Date & time'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                  {tx.loading ? <TableSkeleton cols={6} /> : <tbody>
                    {tx.data?.map((t) => (
                      <tr key={t.id}>
                        <td className="td font-mono text-[12px]">{t.type === 'refund' ? t.razorpay_refund_id : t.razorpay_payment_id || t.razorpay_order_id}</td>
                        <td className="td">{t.order_no}</td>
                        <td className="td text-mut">{t.type === 'refund' ? 'Refund → ' : ''}<span className="uppercase">{t.method || '—'}</span> {t.method_detail}</td>
                        <td className={`td font-bold ${t.type === 'refund' ? 'text-blue' : ''}`}>{t.type === 'refund' ? '−' : ''}{inr(t.amount, 2)}</td>
                        <td className="td"><TxStatus t={t} /></td>
                        <td className="td text-mut">{dt(t.created_at)}</td>
                      </tr>
                    ))}
                    {!tx.data?.length && <tr><td colSpan={6}><Empty title="Koi transaction nahi" /></td></tr>}
                  </tbody>}
                </table>
              </div>
              <Pagination meta={tx.meta} onPage={(page) => setTp({ ...tp, page })} />
            </Card>
          )}
          {tab === 'addresses' && (
            <div className="grid gap-3 md:grid-cols-2">
              {u.addresses.map((a) => (
                <Card key={a.id}><div className="mb-1 flex items-center gap-2"><b>{a.name}</b><Badge tone="mut">{a.label}</Badge>{a.is_default ? <Badge tone="p">Default</Badge> : null}</div>
                  <p className="text-[13px] text-ink-2">{a.flat_house}, {a.area_street}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} – {a.pincode}</p>
                  <p className="mt-1 text-[12px] text-mut">{a.country_code} {a.phone}</p></Card>
              ))}
              {!u.addresses.length && <Empty title="Koi address save nahi" />}
            </div>
          )}
        </div>
      </div>
      <Confirm open={block} danger={!u.is_blocked} title={u.is_blocked ? 'Customer unblock karein?' : 'Customer block karein?'} confirmText={u.is_blocked ? 'Unblock' : 'Block'} loading={busy} onClose={() => setBlock(false)}
        message={u.is_blocked ? 'Customer dobara app use kar payega.' : 'Customer turant logout ho jayega aur app use nahi kar payega.'}
        onConfirm={async () => { if (await run(() => api.patch(`/customers/${u.id}/block`, { blocked: !u.is_blocked }))) { setBlock(false); reload(true); } }} />
    </>
  );
}
