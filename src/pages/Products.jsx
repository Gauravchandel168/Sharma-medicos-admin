import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Pencil, Pill, Plus, Trash2, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { inr } from '../utils/format';
import { Badge, Button, Checkbox, Confirm, Empty, IconBtn, Input, Modal, PageHeader, Pagination, SearchInput, Select, TableSkeleton, Toggle } from '../components/ui';

export const StockBar = ({ qty, low = 10, max = 100 }) => {
  const color = qty <= 0 ? '#E5484D' : qty <= low ? '#D98A06' : '#129A4E';
  return (
    <div className="w-[96px]">
      <div className="text-[12px] font-semibold" style={{ color }}>{qty <= 0 ? 'Out of stock' : qty <= low ? `Low · ${qty}` : `${qty} units`}</div>
      <div className="mt-1 h-1.5 rounded-full bg-[#EEF2F1]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.min(100, (qty / max) * 100))}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} /></div>
    </div>
  );
};

export default function Products() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState({ page: 1, search: '', category_id: '', stock: 'all', rx: 'all', status: 'all' });
  const { data, meta, loading, reload } = useFetch('/products', { ...q, category_id: q.category_id || undefined });
  const { data: cats } = useFetch('/categories');
  const [sel, setSel] = useState([]);
  const [del, setDel] = useState(null);
  const [pricePct, setPricePct] = useState(null);
  const { busy, run } = useAction();
  const set = (k) => (v) => setQ((s) => ({ ...s, [k]: v?.target ? v.target.value : v, page: 1 }));

  const bulk = async (action, value) => {
    if (await run(() => api.post('/products/bulk', { ids: sel, action, value }))) { setSel([]); setPricePct(null); reload(true); }
  };
  const toggle = async (p, field, value) => { await run(() => api.patch(`/products/${p.id}/toggle`, { field, value }), { success: '' }); reload(true); };

  return (
    <>
      <PageHeader title="Products" subtitle={`Catalog · ${meta?.total ?? '…'} products`}
        actions={can('products', 'create') && <Button icon={Plus} onClick={() => navigate('/products/new')}>Add product</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput className="w-[260px]" placeholder="Search name, SKU, salt…" value={q.search} onChange={set('search')} />
        <Select className="w-[180px]" value={q.category_id} onChange={set('category_id')} placeholder="All categories" options={(cats || []).map((c) => ({ value: c.id, label: (c.parent_id ? '— ' : '') + c.name }))} />
        <Select className="w-[140px]" value={q.stock} onChange={set('stock')} options={[{ value: 'all', label: 'Stock: All' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} />
        <Select className="w-[120px]" value={q.rx} onChange={set('rx')} options={[{ value: 'all', label: 'Rx: All' }, { value: '1', label: 'Rx only' }, { value: '0', label: 'OTC' }]} />
        <Select className="w-[130px]" value={q.status} onChange={set('status')} options={[{ value: 'all', label: 'Status: All' }, { value: 'active', label: 'Active' }, { value: 'hidden', label: 'Hidden' }]} />
      </div>
      {sel.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-p-mint px-4 py-2.5 text-[13px]">
          <b>{sel.length} selected</b>
          <button className="font-semibold text-p" onClick={() => setPricePct(0)}>Bulk price update</button>
          <button className="font-semibold text-p" onClick={() => bulk('spotlight_on')}>Add to spotlight</button>
          <button className="font-semibold text-p" onClick={() => bulk('hide')}>Hide</button>
          <button className="font-semibold text-p" onClick={() => bulk('show')}>Show</button>
          {can('products', 'delete') && <button className="font-semibold text-bad" onClick={() => bulk('delete')}>Delete</button>}
          <button className="ml-auto text-mut" onClick={() => setSel([])}>Clear</button>
        </motion.div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead><tr>
            <th className="th w-10"><Checkbox checked={data?.length > 0 && sel.length === data.length} onChange={(v) => setSel(v ? data.map((p) => p.id) : [])} /></th>
            <th className="th">Product</th><th className="th">Category</th><th className="th">MRP</th><th className="th">Price</th><th className="th">Off</th><th className="th">Stock</th><th className="th">Spotlight</th><th className="th">Active</th><th className="th" />
          </tr></thead>
          {loading ? <TableSkeleton cols={10} /> : (
            <tbody>
              {data?.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-[#F8FBFA]">
                  <td className="td"><Checkbox checked={sel.includes(p.id)} onChange={(v) => setSel(v ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url || '/favicon.svg'} alt="" className="h-10 w-10 rounded-lg bg-p-mint object-cover" />
                      <div>
                        <div className="font-semibold">{p.name} {p.rx_required && <Badge tone="bad" className="ml-1 !px-1.5">Rx</Badge>}</div>
                        <div className="text-[11.5px] text-mut">SKU {p.sku} · {p.pack_size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td text-mut">{p.category_name}</td>
                  <td className="td text-mut line-through">{inr(p.mrp)}</td>
                  <td className="td font-bold">{inr(p.price)}</td>
                  <td className="td font-bold text-acc">{p.discount_percent}%</td>
                  <td className="td"><StockBar qty={p.stock_qty} low={p.low_stock_threshold} /></td>
                  <td className="td"><button disabled={!can('products', 'edit')} onClick={() => toggle(p, 'in_spotlight', !p.in_spotlight)}><Badge tone={p.in_spotlight ? 'warn' : 'mut'} icon={Zap}>{p.in_spotlight ? 'ON' : 'OFF'}</Badge></button></td>
                  <td className="td"><Toggle checked={p.is_active} disabled={!can('products', 'edit')} onChange={(v) => toggle(p, 'is_active', v)} /></td>
                  <td className="td"><div className="flex justify-end gap-1.5">
                    {can('products', 'edit') && <IconBtn icon={Pencil} title="Edit" onClick={() => navigate(`/products/${p.id}`)} />}
                    {can('products', 'create') && <IconBtn icon={Copy} title="Duplicate" onClick={() => navigate(`/products/new?copy=${p.id}`)} />}
                    {can('products', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel(p)} />}
                  </div></td>
                </motion.tr>
              ))}
              {!data?.length && <tr><td colSpan={10}><Empty icon={Pill} title="Koi product nahi mila" subtitle="Filter badal kar dekhein ya naya product add karein" /></td></tr>}
            </tbody>
          )}
        </table>
        <Pagination meta={meta} onPage={(page) => setQ({ ...q, page })} />
      </div>
      <Confirm open={!!del} danger title="Product delete karein?" confirmText="Delete" loading={busy} onClose={() => setDel(null)} message={<>“{del?.name}” app se hat jayega. Purane orders me record rahega.</>}
        onConfirm={async () => { if (await run(() => api.delete(`/products/${del.id}`))) { setDel(null); reload(true); } }} />
      <Modal open={pricePct !== null} onClose={() => setPricePct(null)} title="Bulk price update" width={400}
        footer={<><Button variant="outline" onClick={() => setPricePct(null)}>Cancel</Button><Button loading={busy} onClick={() => bulk('price_percent', Number(pricePct))}>Apply</Button></>}>
        <Input label="Price kitne % badlein? (minus = kam)" type="number" value={pricePct ?? ''} onChange={(e) => setPricePct(e.target.value)} hint="Example: -10 = 10% sasta. Price kabhi MRP se upar nahi jayega." />
      </Modal>
    </>
  );
}
