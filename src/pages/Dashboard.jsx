import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, FileText, IndianRupee, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFetch } from '../utils/useFetch';
import { inr, timeAgo, DELIVERY } from '../utils/format';
import { Badge, Button, Card, Empty, Kpi, PageHeader, Shimmer, StatusBadge, Tabs, Avatar } from '../components/ui';

const STATUS_COLORS = { delivered: '#129A4E', shipped: '#17877B', packed: '#D98A06', confirmed: '#7C4DDB', placed: '#2F6FEB', cancelled: '#E5484D' };

export default function Dashboard() {
  const { admin } = useAuth();
  const [days, setDays] = useState(14);
  const { data: d, loading, reload } = useFetch('/dashboard', { days });
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const pct = (v) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v)}%`;
  const statusTotal = d?.order_status.reduce((a, s) => a + s.count, 0) || 0;

  return (
    <>
      <PageHeader title={`${greet}, ${admin?.name?.split(' ')[0]} 👋`} subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={<Button variant="outline" icon={RefreshCw} onClick={() => reload()}>Refresh</Button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi loading={loading} icon={Package} label="Orders today" value={d?.today.orders} sub={d && `${pct(d.today.orders_change)} vs yesterday`} down={d?.today.orders_change < 0} />
        <Kpi loading={loading} icon={IndianRupee} tone="ok" label="Revenue today" value={d && inr(d.today.revenue)} sub={d && `${pct(d.today.revenue_change)} vs yesterday`} down={d?.today.revenue_change < 0} />
        <Kpi loading={loading} icon={FileText} tone="bad" label="Rx pending review" value={d?.rx_pending} sub={d?.rx_pending ? 'Pharmacist verify karein' : 'All clear'} down={d?.rx_pending > 0} />
        <Kpi loading={loading} icon={AlertTriangle} tone="warn" label="Low / out of stock" value={d && d.stock.low_stock + d.stock.out_of_stock} sub={d && `${d.stock.expiring_soon} batches expiring ≤ 90 days`} down />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Sales overview" actions={<Tabs value={days} onChange={setDays} tabs={[{ value: 7, label: '7D' }, { value: 14, label: '14D' }, { value: 30, label: '30D' }, { value: 90, label: '90D' }]} />}>
          {loading ? <Shimmer className="h-[260px]" /> : (<>
            <div className="mb-2 flex items-center gap-3">
              <div><div className="font-display text-[22px] font-extrabold">{inr(d.period.revenue)}</div><div className="text-[12px] text-mut">{d.period.orders} orders · {days} days</div></div>
              <Badge tone={d.period.revenue_change >= 0 ? 'ok' : 'bad'}>{pct(d.period.revenue_change)}</Badge>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={d.sales_series} margin={{ left: -10, right: 6, top: 10 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17877B" stopOpacity={0.3} /><stop offset="1" stopColor="#17877B" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#EEF2F1" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).getDate()} tick={{ fontSize: 11, fill: '#6B7C7A' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} tick={{ fontSize: 11, fill: '#6B7C7A' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', background: '#0E1B19', color: '#fff', fontSize: 12 }} labelStyle={{ color: '#9FE3D7' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} formatter={(v, n) => [n === 'revenue' ? inr(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="revenue" stroke="#0F5F57" strokeWidth={2.5} fill="url(#rev)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </>)}
        </Card>
        <Card title="Order status" actions={<span className="text-[12px] text-mut">Last 7 days</span>}>
          {loading ? <Shimmer className="h-[230px]" /> : !statusTotal ? <Empty title="Abhi koi order nahi" /> : (
            <div className="flex items-center gap-4">
              <div className="relative h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer><PieChart><Pie data={d.order_status} dataKey="count" nameKey="label" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none" animationDuration={800}>
                  {d.order_status.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#B7C3C1'} />)}</Pie></PieChart></ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-[24px] font-extrabold">{statusTotal}</div><div className="text-[11px] text-mut">orders</div></div></div>
              </div>
              <div className="flex-1 space-y-2">
                {d.order_status.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-[12.5px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} /><span className="flex-1">{s.label}</span><b>{Math.round((s.count / statusTotal) * 100)}%</b></div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card noPad title="Recent orders" actions={<Link to="/orders" className="text-[12.5px] font-semibold text-p">View all →</Link>}>
          <table className="w-full">
            <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Delivery</th><th className="th">Amount</th><th className="th">Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-4"><Shimmer className="h-32" /></td></tr> : d.recent_orders.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => navigate(`/orders/${o.id}`)} className="cursor-pointer hover:bg-[#F8FBFA]">
                  <td className="td font-bold">{o.order_no}<div className="text-[11px] font-normal text-mut">{timeAgo(o.created_at)}</div></td>
                  <td className="td"><div className="flex items-center gap-2"><Avatar name={o.customer_name} size={26} />{o.customer_name}</div></td>
                  <td className="td text-mut">{DELIVERY[o.delivery_method]}</td>
                  <td className="td font-bold">{inr(o.total)}</td>
                  <td className="td"><StatusBadge status={o.status} label={o.status_label} /></td>
                </motion.tr>
              ))}
              {!loading && !d.recent_orders.length && <tr><td colSpan={5}><Empty title="Abhi koi order nahi aaya" /></td></tr>}
            </tbody>
          </table>
        </Card>
        <Card title="Stock alerts" actions={<Link to="/inventory" className="text-[12.5px] font-semibold text-p">Inventory →</Link>}>
          {loading ? <Shimmer className="h-40" /> : !d.stock_alerts.length ? <Empty title="Sab stock theek hai 👍" /> : d.stock_alerts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-[#EEF2F1] py-2.5 last:border-0">
              <img src={p.image_url} alt="" className="h-9 w-9 rounded-lg bg-p-mint object-cover" />
              <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
              <Badge tone={p.stock_qty <= 0 ? 'bad' : 'warn'}>{p.stock_qty <= 0 ? 'Out' : `${p.stock_qty} left`}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
