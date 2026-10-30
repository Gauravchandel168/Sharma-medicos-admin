import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Boxes, CalendarClock, Plus, X as XIcon, History } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { dateOnly, inr, timeAgo } from '../utils/format';
import { Badge, Button, Card, Drawer, Empty, Input, Kpi, PageHeader, Pagination, SearchInput, Select, TableSkeleton, Tabs } from '../components/ui';
import { StockBar } from './Products';

function Adjust({ open, onClose, preset, onDone }) {
  const [f, setF] = useState({ type: 'add', product_id: '', qty: '', batch_no: '', expiry_date: '', cost_price: '', reason: 'purchase', note: '' });
  const [search, setSearch] = useState('');
  const { data: products } = useFetch(open ? '/products' : null, { search, per_page: 8 });
  const { busy, run } = useAction();
  const p = preset || {};
  const set = (k) => (e) => setF({ ...f, [k]: e.target ? e.target.value : e });
  const pid = f.product_id || p.product_id;
  const submit = async () => {
    const body = { ...f, product_id: Number(pid), qty: Number(f.qty), batch_no: f.batch_no || p.batch_no, expiry_date: f.expiry_date || undefined, cost_price: f.cost_price ? Number(f.cost_price) : undefined, note: f.note || undefined };
    if (await run(() => api.post('/inventory/adjust', body))) { onDone(); onClose(); }
  };
  return (
    <Drawer open={open} onClose={onClose} title="Stock adjustment" width={420}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!pid || !f.qty} onClick={submit}>Update stock</Button></>}>
      <Tabs className="mb-4 w-full [&>button]:flex-1" value={f.type} onChange={(v) => setF({ ...f, type: v, reason: v === 'add' ? 'purchase' : 'expired' })} tabs={[{ value: 'add', label: '+ Add stock' }, { value: 'remove', label: '− Remove' }]} />
      {p.product_id ? (
        <div className="mb-3 rounded-xl bg-p-mint p-3 text-[13px]"><b>{p.name}</b><div className="text-[12px] text-mut">Batch {p.batch_no || 'new'} · current {p.stock_qty}</div></div>
      ) : (
        <div className="mb-3">
          <SearchInput placeholder="Product search…" value={search} onChange={setSearch} />
          <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-line">
            {(products || []).map((x) => (
              <button key={x.id} onClick={() => setF({ ...f, product_id: x.id })} className={`flex w-full items-center gap-2 border-b border-[#EEF2F1] px-3 py-2 text-left text-[13px] last:border-0 ${f.product_id === x.id ? 'bg-p-mint' : 'hover:bg-[#F8FBFA]'}`}>
                <img src={x.image_url} className="h-7 w-7 rounded bg-p-mint" alt="" /><span className="flex-1">{x.name}</span><span className="text-[11px] text-mut">{x.stock_qty}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Qty" type="number" value={f.qty} onChange={set('qty')} />
        <Input label="Batch no." placeholder={p.batch_no || 'e.g. ORS-2510'} value={f.batch_no} onChange={set('batch_no')} />
        {f.type === 'add' && <Input label="Expiry (new batch)" type="date" value={f.expiry_date} onChange={set('expiry_date')} />}
        {f.type === 'add' && <Input label="Cost price" type="number" value={f.cost_price} onChange={set('cost_price')} />}
        <Select className="col-span-2" label="Reason" value={f.reason} onChange={set('reason')} options={(f.type === 'add' ? ['purchase', 'return', 'adjustment'] : ['expired', 'damage', 'adjustment']).map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))} />
        <Input className="col-span-2" label="Note" value={f.note} onChange={set('note')} />
      </div>
      {f.type === 'add' && <p className="mt-3 text-[12px] text-mut">Out of stock product me stock aate hi “Notify me” wale customers ko push notification chala jayega.</p>}
    </Drawer>
  );
}

export default function Inventory() {
  const { can } = useAuth();
  const [q, setQ] = useState({ page: 1, filter: 'all', search: '' });
  const { data: s, loading: sl, reload: rs } = useFetch('/inventory/summary');
  const { data, meta, loading, reload } = useFetch('/inventory/batches', q);
  const { data: moves, reload: rm } = useFetch('/inventory/movements', { per_page: 8 });
  const [adj, setAdj] = useState(null);
  const refresh = () => { reload(true); rs(true); rm(true); };

  return (
    <>
      <PageHeader title="Inventory & stock" subtitle="Batch-wise stock, expiry aur movement history"
        actions={can('inventory', 'edit') && <Button icon={Plus} onClick={() => setAdj({})}>Stock adjustment</Button>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi loading={sl} icon={Boxes} label="Total SKUs" value={s?.total_skus} sub={s && `${s.in_stock} in stock`} />
        <Kpi loading={sl} icon={AlertTriangle} tone="warn" label="Low stock" value={s?.low_stock} sub="Alert level se kam" down />
        <Kpi loading={sl} icon={XIcon} tone="bad" label="Out of stock" value={s?.out_of_stock} sub='App me "Out of stock" dikh raha' down />
        <Kpi loading={sl} icon={CalendarClock} tone="vio" label="Expiring ≤ 90 days" value={s?.expiring_90_days} sub={s?.expired_batches ? `${s.expired_batches} batches expired!` : 'Batch-wise dekhein'} down />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]">
        <Card noPad title="Batch-wise stock" actions={<div className="flex gap-2"><SearchInput className="w-[200px]" placeholder="Product / batch…" value={q.search} onChange={(v) => setQ({ ...q, search: v, page: 1 })} />
          <Select className="w-[140px]" value={q.filter} onChange={(e) => setQ({ ...q, filter: e.target.value, page: 1 })} options={[{ value: 'all', label: 'All stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }, { value: 'expiring', label: 'Expiring soon' }, { value: 'expired', label: 'Expired' }]} /></div>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr><th className="th">Product</th><th className="th">Batch</th><th className="th">Batch qty</th><th className="th">Total stock</th><th className="th">Expiry</th><th className="th">Cost</th><th className="th" /></tr></thead>
              {loading ? <TableSkeleton cols={7} /> : (
                <tbody>
                  {data?.map((r, i) => {
                    const d = r.days_to_expiry;
                    const tone = d === null ? 'mut' : d <= 0 ? 'bad' : d <= 90 ? 'warn' : 'ok';
                    return (
                      <motion.tr key={`${r.product_id}-${r.batch_id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-[#F8FBFA]">
                        <td className="td"><div className="flex items-center gap-2.5"><img src={r.image_url} className="h-8 w-8 rounded-lg bg-p-mint object-cover" alt="" /><div><div className="font-semibold">{r.name}</div><div className="text-[11px] text-mut">{r.location || r.sku}</div></div></div></td>
                        <td className="td font-mono text-[12px]">{r.batch_no || '—'}</td>
                        <td className="td">{r.batch_qty ?? '—'}</td>
                        <td className="td"><StockBar qty={r.stock_qty} low={r.low_stock_threshold} /></td>
                        <td className="td">{r.expiry_date ? <Badge tone={tone}>{dateOnly(r.expiry_date)}{d !== null && d <= 90 ? ` · ${d <= 0 ? 'expired' : `${d}d`}` : ''}</Badge> : '—'}</td>
                        <td className="td text-mut">{r.cost_price ? inr(r.cost_price) : '—'}</td>
                        <td className="td">{can('inventory', 'edit') && <Button size="sm" variant="outline" icon={Plus} onClick={() => setAdj(r)}>Stock</Button>}</td>
                      </motion.tr>
                    );
                  })}
                  {!data?.length && <tr><td colSpan={7}><Empty icon={Boxes} title="Kuch nahi mila" /></td></tr>}
                </tbody>
              )}
            </table>
          </div>
          <Pagination meta={meta} onPage={(page) => setQ({ ...q, page })} />
        </Card>
        <Card title={<span className="flex items-center gap-2"><History size={15} />Stock movement</span>}>
          {(moves || []).map((m) => (
            <div key={m.id} className="flex gap-3 border-b border-[#EEF2F1] py-2.5 last:border-0">
              <b className={`w-10 text-[13px] ${m.change_qty > 0 ? 'text-ok' : m.reason === 'sale' ? 'text-ink' : 'text-bad'}`}>{m.change_qty > 0 ? '+' : ''}{m.change_qty}</b>
              <div className="flex-1"><div className="text-[12.5px] font-semibold">{m.product_name}</div><div className="text-[11.5px] text-mut">{m.reason === 'sale' ? `Order ${m.order_no}` : `${m.reason}${m.admin_name ? ' · ' + m.admin_name : ''}`}{m.batch_no ? ` · ${m.batch_no}` : ''}</div></div>
              <span className="text-[11px] text-mut">{timeAgo(m.created_at)}</span>
            </div>
          ))}
          {!moves?.length && <Empty title="Koi movement nahi" />}
        </Card>
      </div>
      <Adjust open={!!adj} preset={adj?.product_id ? adj : null} onClose={() => setAdj(null)} onDone={refresh} />
    </>
  );
}
