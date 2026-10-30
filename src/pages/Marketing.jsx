import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Copy, Pencil, Percent, Plus, Ticket, Trash2, UploadCloud, Zap } from 'lucide-react';
import { api, uploadImages } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { dateOnly, inr } from '../utils/format';
import { Badge, Button, Card, Checkbox, Confirm, Drawer, Empty, IconBtn, ImageDrop, Input, PageHeader, Select, Shimmer, Tabs, Toggle } from '../components/ui';

const STATE = { live: ['Live', 'ok'], scheduled: ['Scheduled', 'blue'], ended: ['Ended', 'mut'], inactive: ['Off', 'mut'] };
const toLocal = (v) => { if (!v) return ''; const d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const bannerBlank = (placement) => ({ placement, category_id: '', title: '', subtitle: '', tag: '', image_url: '', color_from: '#FF8A4C', color_to: '#E2482A', action_type: 'none', action_value: '', starts_at: '', ends_at: '', sort_order: 0, is_active: true });
const couponBlank = { code: '', description: '', discount_type: 'percent', discount_value: '', max_discount: '', min_order: 0, usage_limit: '', per_user_limit: 1, first_order_only: false, category_id: '', starts_at: '', ends_at: '', is_active: true };

function BannerPreview({ b }) {
  return (
    <div className="relative h-[92px] overflow-hidden rounded-xl p-3 text-white" style={{ background: b.image_url ? `url(${b.image_url}) center/cover` : `linear-gradient(120deg, ${b.color_from || '#17877B'}, ${b.color_to || '#0F5F57'})` }}>
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
      {b.tag && <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold">{b.tag}</span>}
      <div className="mt-1 max-w-[70%] text-[15px] font-extrabold leading-tight drop-shadow">{b.title || 'Banner title'}</div>
      <div className="text-[11px] opacity-90">{b.subtitle}</div>
    </div>
  );
}

export default function Marketing() {
  const { can } = useAuth();
  const [tab, setTab] = useState('banners');
  const banners = useFetch('/banners');
  const coupons = useFetch(can('coupons') ? '/coupons' : null);
  const { data: cats } = useFetch('/categories');
  const [bf, setBf] = useState(null);
  const [cf, setCf] = useState(null);
  const [del, setDel] = useState(null);
  const [up, setUp] = useState(false);
  const [order, setOrder] = useState(null);
  const { busy, run } = useAction();

  const home = order || (banners.data || []).filter((b) => b.placement === 'home');
  const spot = (banners.data || []).filter((b) => b.placement === 'spotlight');

  const saveBanner = async () => {
    const body = { ...bf, category_id: bf.category_id ? Number(bf.category_id) : null, sort_order: Number(bf.sort_order) || 0, image_url: bf.image_url || null, starts_at: bf.starts_at || null, ends_at: bf.ends_at || null, action_value: bf.action_value || null };
    if (await run(() => (bf.id ? api.put(`/banners/${bf.id}`, body) : api.post('/banners', body)))) { setBf(null); banners.reload(true); }
  };
  const saveCoupon = async () => {
    const n = (v) => (v === '' || v === null ? null : Number(v));
    const body = { ...cf, discount_value: Number(cf.discount_value), max_discount: n(cf.max_discount), min_order: Number(cf.min_order) || 0, usage_limit: n(cf.usage_limit), per_user_limit: Number(cf.per_user_limit) || 1, category_id: n(cf.category_id), starts_at: cf.starts_at || null, ends_at: cf.ends_at || null };
    if (await run(() => (cf.id ? api.put(`/coupons/${cf.id}`, body) : api.post('/coupons', body)))) { setCf(null); coupons.reload(true); }
  };

  return (
    <>
      <PageHeader title="Spotlight, banners & coupons" subtitle="Marketing · App ke home aur category screens"
        actions={<>{can('coupons', 'create') && <Button variant="outline" icon={Plus} onClick={() => setCf({ ...couponBlank })}>New coupon</Button>}
          {can('banners', 'create') && <Button icon={Plus} onClick={() => setBf(bannerBlank(tab === 'spotlight' ? 'spotlight' : 'home'))}>New {tab === 'spotlight' ? 'spotlight offer' : 'banner'}</Button>}</>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'banners', label: 'Home banners', count: home.length }, { value: 'spotlight', label: '⚡ In the Spotlight', count: spot.length }, ...(can('coupons') ? [{ value: 'coupons', label: 'Coupons', count: coupons.data?.length }] : [])]} />

      {tab === 'banners' && (banners.loading ? <Shimmer className="h-40" /> : (
        <>
          <p className="mb-2 text-[12px] text-mut">App me auto-slide hote hain (har 3 sec). Drag karke order badlein.</p>
          <Reorder.Group axis="x" values={home} onReorder={setOrder} className="flex flex-wrap gap-3">
            {home.map((b) => (
              <Reorder.Item key={b.id} value={b} onDragEnd={async () => { if (order) await run(() => api.patch('/banners/reorder', { ids: order.map((x) => x.id) }), { success: 'Order save ho gaya' }); }} className="card w-[280px] cursor-grab overflow-hidden" whileDrag={{ scale: 1.03 }}>
                <BannerPreview b={b} />
                <div className="flex items-center justify-between p-3 text-[12px]">
                  <span><Badge tone={STATE[b.state][1]}>{STATE[b.state][0]}</Badge> <span className="text-mut">{b.ends_at ? `till ${dateOnly(b.ends_at)}` : 'No end'}</span></span>
                  <span className="flex items-center gap-1.5"><Toggle checked={b.is_active} disabled={!can('banners', 'edit')} onChange={async (v) => { await run(() => api.patch(`/banners/${b.id}/toggle`, { is_active: v }), { success: '' }); banners.reload(true); }} />
                    {can('banners', 'edit') && <IconBtn icon={Pencil} onClick={() => setBf({ ...bannerBlank('home'), ...b, category_id: b.category_id || '', starts_at: toLocal(b.starts_at), ends_at: toLocal(b.ends_at) })} />}
                    {can('banners', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel({ type: 'banners', ...b })} />}</span>
                </div>
              </Reorder.Item>
            ))}
            {can('banners', 'create') && <button onClick={() => setBf(bannerBlank('home'))} className="flex h-[150px] w-[200px] flex-col items-center justify-center gap-1.5 rounded-xl2 border-[1.5px] border-dashed border-[#B7C3C1] text-[12.5px] text-mut hover:border-p"><UploadCloud size={20} />Upload banner<span className="text-[11px]">1080 × 480</span></button>}
          </Reorder.Group>
        </>
      ))}

      {tab === 'spotlight' && (
        <Card noPad title={<span className="flex items-center gap-2"><Zap size={15} className="text-acc" />In the Spotlight — category-wise offers</span>}>
          <table className="w-full">
            <thead><tr>{['Preview', 'Category', 'Offer', 'Schedule', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {spot.map((b, i) => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="td w-[220px]"><div className="w-[200px]"><BannerPreview b={b} /></div></td>
                  <td className="td font-semibold">{b.category_name}</td>
                  <td className="td">{b.title}<div className="text-[11.5px] text-mut">{b.action_type !== 'none' ? `→ ${b.action_type} ${b.action_value || ''}` : ''}</div></td>
                  <td className="td text-[12px] text-mut">{b.starts_at ? dateOnly(b.starts_at) : 'Now'} → {b.ends_at ? dateOnly(b.ends_at) : '∞'}</td>
                  <td className="td"><Badge tone={STATE[b.state][1]}>{STATE[b.state][0]}</Badge></td>
                  <td className="td"><div className="flex gap-1.5">{can('banners', 'edit') && <IconBtn icon={Pencil} onClick={() => setBf({ ...bannerBlank('spotlight'), ...b, category_id: b.category_id || '', starts_at: toLocal(b.starts_at), ends_at: toLocal(b.ends_at) })} />}
                    {can('banners', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel({ type: 'banners', ...b })} />}</div></td>
                </motion.tr>
              ))}
              {!spot.length && <tr><td colSpan={6}><Empty icon={Zap} title="Koi spotlight offer nahi" subtitle="Category ke liye offer banayein — app me us category par auto-slide hoga" /></td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'coupons' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coupons.data?.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-4">
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" /><div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-bg" />
              <div className="flex items-start justify-between">
                <button onClick={() => navigator.clipboard.writeText(c.code)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-p-light bg-p-mint px-2.5 py-1 font-mono text-[14px] font-bold text-p"><Ticket size={14} />{c.code}<Copy size={12} /></button>
                <Toggle checked={c.is_active} disabled={!can('coupons', 'edit')} onChange={async (v) => { await run(() => api.patch(`/coupons/${c.id}/toggle`, { is_active: v }), { success: '' }); coupons.reload(true); }} />
              </div>
              <div className="mt-3 font-display text-[22px] font-extrabold">{c.discount_type === 'percent' ? `${Number(c.discount_value)}% OFF` : `${inr(c.discount_value)} OFF`}</div>
              <p className="text-[12.5px] text-mut">{c.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {c.min_order > 0 && <Badge>Min {inr(c.min_order)}</Badge>}{c.max_discount && <Badge>Max {inr(c.max_discount)}</Badge>}
                {c.first_order_only ? <Badge tone="acc">First order</Badge> : null}{c.category_name && <Badge tone="blue">{c.category_name}</Badge>}
                <Badge tone="p">Used {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</Badge>
              </div>
              <div className="mt-3 flex justify-end gap-1.5">{can('coupons', 'edit') && <IconBtn icon={Pencil} onClick={() => setCf({ ...couponBlank, ...c, max_discount: c.max_discount ?? '', usage_limit: c.usage_limit ?? '', category_id: c.category_id || '', starts_at: toLocal(c.starts_at), ends_at: toLocal(c.ends_at) })} />}
                {can('coupons', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel({ type: 'coupons', ...c, title: c.code })} />}</div>
            </motion.div>
          ))}
          {!coupons.data?.length && <Empty icon={Percent} title="Koi coupon nahi" />}
        </div>
      )}

      <Drawer open={!!bf} onClose={() => setBf(null)} title={bf?.id ? 'Edit banner' : bf?.placement === 'spotlight' ? 'New spotlight offer' : 'New home banner'} width={460}
        footer={<><Button variant="outline" onClick={() => setBf(null)}>Cancel</Button><Button loading={busy} disabled={!bf?.title} onClick={saveBanner}>Save</Button></>}>
        {bf && <div className="space-y-3">
          <BannerPreview b={bf} />
          <Select label="Placement" value={bf.placement} onChange={(e) => setBf({ ...bf, placement: e.target.value })} options={[{ value: 'home', label: 'Home banner slider' }, { value: 'spotlight', label: 'In the Spotlight (category)' }]} />
          {bf.placement === 'spotlight' && <Select label="Category" value={bf.category_id} onChange={(e) => setBf({ ...bf, category_id: e.target.value })} placeholder="Select…" options={(cats || []).map((c) => ({ value: c.id, label: c.name }))} />}
          <Input label="Title" value={bf.title} onChange={(e) => setBf({ ...bf, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Subtitle" value={bf.subtitle || ''} onChange={(e) => setBf({ ...bf, subtitle: e.target.value })} /><Input label="Tag" placeholder="LIMITED" value={bf.tag || ''} onChange={(e) => setBf({ ...bf, tag: e.target.value })} /></div>
          {bf.image_url ? <div className="flex items-center gap-2 text-[12px]"><img src={bf.image_url} className="h-12 w-24 rounded object-cover" alt="" /><Button size="sm" variant="danger" onClick={() => setBf({ ...bf, image_url: '' })}>Remove image</Button></div>
            : <ImageDrop busy={up} onFiles={async (f) => { setUp(true); try { const [r] = await uploadImages(f, '/uploads'); setBf((x) => ({ ...x, image_url: r.url })); } finally { setUp(false); } }} label="Banner image (optional)" hint="Image na ho to gradient dikhega" />}
          <div className="grid grid-cols-2 gap-3"><Input label="Gradient from" type="color" value={bf.color_from || '#17877B'} onChange={(e) => setBf({ ...bf, color_from: e.target.value })} /><Input label="Gradient to" type="color" value={bf.color_to || '#0F5F57'} onChange={(e) => setBf({ ...bf, color_to: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tap karne par" value={bf.action_type} onChange={(e) => setBf({ ...bf, action_type: e.target.value })} options={[{ value: 'none', label: 'Kuch nahi' }, { value: 'product', label: 'Product kholo' }, { value: 'category', label: 'Category kholo' }, { value: 'coupon', label: 'Coupon dikhao' }, { value: 'url', label: 'URL' }]} />
            <Input label={bf.action_type === 'product' ? 'Product ID' : bf.action_type === 'category' ? 'Category ID' : 'Value'} disabled={bf.action_type === 'none'} value={bf.action_value || ''} onChange={(e) => setBf({ ...bf, action_value: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3"><Input label="Starts" type="datetime-local" value={bf.starts_at} onChange={(e) => setBf({ ...bf, starts_at: e.target.value })} /><Input label="Ends" type="datetime-local" value={bf.ends_at} onChange={(e) => setBf({ ...bf, ends_at: e.target.value })} /></div>
          <Checkbox checked={bf.is_active} onChange={(v) => setBf({ ...bf, is_active: v })} label="Active" />
        </div>}
      </Drawer>

      <Drawer open={!!cf} onClose={() => setCf(null)} title={cf?.id ? 'Edit coupon' : 'New coupon'} width={440}
        footer={<><Button variant="outline" onClick={() => setCf(null)}>Cancel</Button><Button loading={busy} disabled={!cf?.code || !cf?.discount_value} onClick={saveCoupon}>Save coupon</Button></>}>
        {cf && <div className="space-y-3">
          <Input label="Code" value={cf.code} onChange={(e) => setCf({ ...cf, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} />
          <Input label="Description" value={cf.description || ''} onChange={(e) => setCf({ ...cf, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Select label="Type" value={cf.discount_type} onChange={(e) => setCf({ ...cf, discount_type: e.target.value })} options={[{ value: 'percent', label: 'Percent %' }, { value: 'flat', label: 'Flat ₹' }]} />
            <Input label={cf.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'} type="number" value={cf.discount_value} onChange={(e) => setCf({ ...cf, discount_value: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Max discount ₹" type="number" value={cf.max_discount} onChange={(e) => setCf({ ...cf, max_discount: e.target.value })} /><Input label="Min order ₹" type="number" value={cf.min_order} onChange={(e) => setCf({ ...cf, min_order: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Input label="Total usage limit" type="number" placeholder="Unlimited" value={cf.usage_limit} onChange={(e) => setCf({ ...cf, usage_limit: e.target.value })} /><Input label="Per customer" type="number" value={cf.per_user_limit} onChange={(e) => setCf({ ...cf, per_user_limit: e.target.value })} /></div>
          <Select label="Sirf is category par" value={cf.category_id} onChange={(e) => setCf({ ...cf, category_id: e.target.value })} placeholder="Sab products" options={(cats || []).map((c) => ({ value: c.id, label: c.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Starts" type="datetime-local" value={cf.starts_at} onChange={(e) => setCf({ ...cf, starts_at: e.target.value })} /><Input label="Ends" type="datetime-local" value={cf.ends_at} onChange={(e) => setCf({ ...cf, ends_at: e.target.value })} /></div>
          <Checkbox checked={cf.first_order_only} onChange={(v) => setCf({ ...cf, first_order_only: v })} label="Sirf pehle order par" />
          <Checkbox checked={cf.is_active} onChange={(v) => setCf({ ...cf, is_active: v })} label="Active" />
        </div>}
      </Drawer>
      <Confirm open={!!del} danger title="Delete karein?" confirmText="Delete" loading={busy} onClose={() => setDel(null)} message={<>“{del?.title}” delete ho jayega.</>}
        onConfirm={async () => { if (await run(() => api.delete(`/${del.type}/${del.id}`))) { setDel(null); banners.reload(true); coupons.reload(true); } }} />
    </>
  );
}
