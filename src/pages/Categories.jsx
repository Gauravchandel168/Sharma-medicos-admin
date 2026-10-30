import { useMemo, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, Layers, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { api, uploadImages } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { Badge, Button, Confirm, Drawer, Empty, IconBtn, ImageDrop, Input, PageHeader, Select, Shimmer, Tabs, Toggle, cx } from '../components/ui';

const blank = { name: '', parent_id: '', icon_url: '', banner_url: '', color_from: '#0F5F57', color_to: '#17877B', sort_order: 0, is_active: true };

export default function Categories() {
  const { can } = useAuth();
  const { data, loading, reload } = useFetch('/categories');
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [uploading, setUploading] = useState('');
  const { busy, run } = useAction();

  const rows = useMemo(() => (data || []).filter((c) => (tab === 'all' ? true : tab === 'active' ? c.is_active : !c.is_active)), [data, tab]);
  const parents = (data || []).filter((c) => !c.parent_id);
  const [order, setOrder] = useState(null);
  const list = order || rows;

  const save = async () => {
    const body = { ...form, parent_id: form.parent_id ? Number(form.parent_id) : null, sort_order: Number(form.sort_order) || 0, color_from: form.color_from || null, color_to: form.color_to || null };
    const ok = await run(() => (form.id ? api.put(`/categories/${form.id}`, body) : api.post('/categories', body)));
    if (ok) { setForm(null); reload(true); }
  };
  const upload = async (files, key) => {
    setUploading(key);
    try { const [r] = await uploadImages(files, '/uploads'); setForm((f) => ({ ...f, [key]: r.url })); } finally { setUploading(''); }
  };
  const saveOrder = async (ids) => { await run(() => api.patch('/categories/reorder', { ids }), { success: 'Order save ho gaya' }); };

  return (
    <>
      <PageHeader title="Categories" subtitle="Catalog · App me yahi categories aur unka order dikhega"
        actions={can('categories', 'create') && <Button icon={Plus} onClick={() => setForm({ ...blank })}>Add category</Button>} />
      <div className="mb-3 flex items-center gap-3">
        <Tabs value={tab} onChange={(v) => { setTab(v); setOrder(null); }} tabs={[{ value: 'all', label: 'All', count: data?.length }, { value: 'active', label: 'Active', count: data?.filter((c) => c.is_active).length }, { value: 'hidden', label: 'Hidden', count: data?.filter((c) => !c.is_active).length }]} />
        <span className="text-[12px] text-mut">⋮⋮ drag karke order badlein</span>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[28px_1fr_90px_90px_120px_70px_96px] gap-2 border-b border-line bg-[#F8FAFA] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-mut">
          <span /><span>Category</span><span>Sub-cat.</span><span>Products</span><span>Spotlight</span><span>Active</span><span className="text-right">Actions</span>
        </div>
        {loading ? <div className="space-y-2 p-4">{[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} className="h-10" />)}</div> : !list.length ? <Empty icon={Layers} title="Koi category nahi" /> : (
          <Reorder.Group axis="y" values={list} onReorder={(v) => setOrder(v)}>
            {list.map((c) => (
              <Reorder.Item key={c.id} value={c} onDragEnd={() => order && saveOrder(order.map((x) => x.id))}
                className="grid grid-cols-[28px_1fr_90px_90px_120px_70px_96px] items-center gap-2 border-b border-[#EEF2F1] bg-white px-4 py-2.5 text-[13px]" whileDrag={{ scale: 1.01, boxShadow: '0 12px 30px -12px rgba(0,0,0,.25)' }}>
                <GripVertical size={16} className="cursor-grab text-[#B7C3C1]" />
                <div className={cx('flex items-center gap-3', c.parent_id && 'pl-6')}>
                  <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${c.color_from || '#17877B'}, ${c.color_to || '#0F5F57'})` }}>
                    {c.icon_url ? <img src={c.icon_url} className="h-full w-full object-cover" alt="" /> : <Layers size={15} />}
                  </div>
                  <div><div className="font-semibold">{c.name}</div><div className="text-[11px] text-mut">{c.parent_name ? `in ${c.parent_name}` : 'Top level'}</div></div>
                </div>
                <span>{c.sub_count}</span><span>{c.product_count}</span>
                <span>{c.spotlight_on ? <Badge tone="warn" icon={Zap}>ON</Badge> : <span className="text-mut">—</span>}</span>
                <Toggle checked={c.is_active} disabled={!can('categories', 'edit')} onChange={async (v) => { await run(() => api.put(`/categories/${c.id}`, { ...c, is_active: v, parent_id: c.parent_id, icon_url: c.icon_url, banner_url: c.banner_url }), { success: v ? 'Category active' : 'Category hidden' }); reload(true); }} />
                <div className="flex justify-end gap-1.5">
                  {can('categories', 'edit') && <IconBtn icon={Pencil} onClick={() => setForm({ ...blank, ...c, parent_id: c.parent_id || '' })} />}
                  {can('categories', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel(c)} />}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      <Drawer open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit category' : 'Add category'}
        footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button loading={busy} onClick={save} disabled={!form?.name}>Save category</Button></>}>
        {form && (
          <div className="space-y-4">
            <Input label="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <Select label="Parent category" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} placeholder="None (top level)" options={parents.filter((p) => p.id !== form.id).map((p) => ({ value: p.id, label: p.name }))} />
            <div>
              <label className="label">Icon / image</label>
              {form.icon_url ? (
                <div className="flex items-center gap-3 rounded-xl border border-line p-2"><img src={form.icon_url} alt="" className="h-14 w-14 rounded-lg object-cover" /><span className="flex-1 truncate text-[12px] text-mut">{form.icon_url.split('/').pop()}</span><IconBtn icon={Trash2} danger onClick={() => setForm({ ...form, icon_url: '' })} /></div>
              ) : <ImageDrop busy={uploading === 'icon_url'} onFiles={(f) => upload(f, 'icon_url')} hint="PNG, 512×512" />}
            </div>
            <div>
              <label className="label">Category banner (app me top par)</label>
              {form.banner_url ? (
                <div className="relative overflow-hidden rounded-xl"><img src={form.banner_url} alt="" className="h-24 w-full object-cover" /><IconBtn icon={Trash2} danger className="absolute right-2 top-2" onClick={() => setForm({ ...form, banner_url: '' })} /></div>
              ) : <ImageDrop busy={uploading === 'banner_url'} onFiles={(f) => upload(f, 'banner_url')} hint="1080 × 400" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gradient from" type="color" className="[&_input]:p-1" value={form.color_from || '#0F5F57'} onChange={(e) => setForm({ ...form, color_from: e.target.value })} />
              <Input label="Gradient to" type="color" className="[&_input]:p-1" value={form.color_to || '#17877B'} onChange={(e) => setForm({ ...form, color_to: e.target.value })} />
            </div>
            <div className="h-14 rounded-xl" style={{ background: `linear-gradient(120deg, ${form.color_from}, ${form.color_to})` }} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              <div><label className="label">Status</label><div className="flex h-10 items-center justify-between rounded-[10px] border border-line px-3 text-[13px]">{form.is_active ? 'Active' : 'Hidden'}<Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} /></div></div>
            </div>
          </div>
        )}
      </Drawer>
      <Confirm open={!!del} danger title="Category delete karein?" confirmText="Delete" loading={busy} onClose={() => setDel(null)}
        message={<>“{del?.name}” delete ho jayegi. Pehle iske products aur sub-categories hatane honge.</>}
        onConfirm={async () => { if (await run(() => api.delete(`/categories/${del.id}`))) { setDel(null); reload(true); } }} />
    </>
  );
}
