import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Box, Check, Eye, FileText, Image as ImageIcon, IndianRupee, Pill, X } from 'lucide-react';
import { api, errMsg, uploadImages } from '../api/client';
import { useFetch } from '../utils/useFetch';
import { Badge, Button, Card, IconBtn, ImageDrop, Input, PageHeader, Select, Shimmer, Textarea, Toggle } from '../components/ui';

const empty = {
  name: '', category_id: '', sku: '', brand: '', manufacturer: '', composition: '', pack_size: '', description: '', uses: '', dosage: '', side_effects: '',
  safety_info: '', storage: '', mrp: '', price: '', gst_percent: 12, offer_text: '', rx_required: false, low_stock_threshold: 10, max_order_qty: 10,
  is_active: true, is_featured: false, in_spotlight: false, images: [],
};

const Section = ({ icon: Icon, title, children }) => (
  <Card className="mb-4" title={<span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-p-mint text-p"><Icon size={13} /></span>{title}</span>}>{children}</Card>
);

export default function ProductForm() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const copyId = sp.get('copy');
  const navigate = useNavigate();
  const { data: cats } = useFetch('/categories');
  const [f, setF] = useState(empty);
  const [stock, setStock] = useState({ qty: '', batch_no: '', expiry_date: '', cost_price: '' });
  const [loading, setLoading] = useState(!!(id || copyId));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const src = id || copyId;
    if (!src) return;
    api.get(`/products/${src}`).then((r) => {
      const p = r.data.data;
      const v = Object.fromEntries(Object.keys(empty).map((k) => [k, p[k] ?? empty[k]]));
      v.images = p.images.map((i) => i.url);
      if (copyId) { v.name = `${p.name} (copy)`; v.sku = ''; }
      setF(v);
    }).catch((e) => toast.error(errMsg(e))).finally(() => setLoading(false));
  }, [id, copyId]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? (e.target.type === 'number' ? e.target.value : e.target.value) : e }));
  const disc = useMemo(() => (Number(f.mrp) > 0 && Number(f.price) > 0 ? Math.round(((f.mrp - f.price) / f.mrp) * 100) : 0), [f.mrp, f.price]);

  const upload = async (files) => {
    if (f.images.length + files.length > 6) return toast.error('Maximum 6 images');
    setUploading(true);
    try { const r = await uploadImages(files); setF((s) => ({ ...s, images: [...s.images, ...r.map((x) => x.url)] })); } catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); }
  };

  const save = async (activeOverride) => {
    const e = {};
    if (!f.name.trim()) e.name = 'Naam zaroori hai';
    if (!f.category_id) e.category_id = 'Category select karein';
    if (!(Number(f.mrp) > 0)) e.mrp = 'MRP daalein';
    if (!(Number(f.price) > 0)) e.price = 'Price daalein';
    if (Number(f.price) > Number(f.mrp)) e.price = 'Price MRP se zyada nahi';
    setErrors(e);
    if (Object.keys(e).length) return toast.error('Form me galtiyan hain');
    const body = {
      ...f, category_id: Number(f.category_id), mrp: Number(f.mrp), price: Number(f.price), gst_percent: Number(f.gst_percent),
      low_stock_threshold: Number(f.low_stock_threshold), max_order_qty: Number(f.max_order_qty), sku: f.sku || null,
      is_active: activeOverride ?? f.is_active,
      opening_stock: !id && stock.qty ? { qty: Number(stock.qty), batch_no: stock.batch_no, expiry_date: stock.expiry_date, cost_price: stock.cost_price ? Number(stock.cost_price) : undefined } : null,
    };
    setBusy(true);
    try {
      const r = id ? await api.put(`/products/${id}`, body) : await api.post('/products', body);
      toast.success(r.data.message);
      navigate('/products');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <div className="space-y-4"><Shimmer className="h-10 w-64" /><Shimmer className="h-64" /><Shimmer className="h-48" /></div>;

  return (
    <>
      <PageHeader title={id ? 'Edit product' : 'Add product'} subtitle="Catalog · Products"
        back={<IconBtn icon={ArrowLeft} onClick={() => navigate('/products')} />}
        actions={<>{!id && <Button variant="outline" loading={busy} onClick={() => save(false)}>Save as draft</Button>}<Button icon={Check} loading={busy} onClick={() => save()}>{id ? 'Save changes' : 'Publish product'}</Button></>} />
      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div>
          <Section icon={FileText} title="Basic information">
            <div className="grid gap-3 md:grid-cols-3">
              <Input className="md:col-span-2" label="Product name" value={f.name} onChange={set('name')} error={errors.name} />
              <Input label="Brand" value={f.brand || ''} onChange={set('brand')} />
              <Select label="Category" value={f.category_id} onChange={set('category_id')} error={errors.category_id} placeholder="Select…" options={(cats || []).map((c) => ({ value: c.id, label: (c.parent_id ? `${c.parent_name} › ` : '') + c.name }))} />
              <Input label="Pack size" placeholder="Strip of 10 tablets" value={f.pack_size || ''} onChange={set('pack_size')} />
              <Input label="SKU" placeholder="Auto" value={f.sku || ''} onChange={set('sku')} />
              <Input className="md:col-span-2" label="Composition / Salt" placeholder="Paracetamol 650mg" value={f.composition || ''} onChange={set('composition')} hint="Customer salt name se bhi search kar payenge" />
              <Input label="Manufacturer" value={f.manufacturer || ''} onChange={set('manufacturer')} />
            </div>
          </Section>
          <Section icon={IndianRupee} title="Pricing">
            <div className="grid gap-3 md:grid-cols-4">
              <Input label="MRP (₹)" type="number" value={f.mrp} onChange={set('mrp')} error={errors.mrp} />
              <Input label="Selling price (₹)" type="number" value={f.price} onChange={set('price')} error={errors.price} />
              <div><label className="label">Discount</label><div className="flex h-10 items-center rounded-[10px] border border-[#F8CDB9] bg-acc-soft px-3 text-[13px] font-bold text-acc">{disc}% OFF · auto</div></div>
              <Select label="GST %" value={f.gst_percent} onChange={set('gst_percent')} options={[0, 5, 12, 18, 28].map((g) => ({ value: g, label: `${g}%` }))} />
              <Input className="md:col-span-4" label="Offer text (optional)" placeholder="Buy 2 Get 1 Free" value={f.offer_text || ''} onChange={set('offer_text')} />
            </div>
          </Section>
          <Section icon={Pill} title="Medicine details (app ke tabs me dikhega)">
            <div className="grid gap-3 md:grid-cols-2">
              <Textarea label="Description" value={f.description || ''} onChange={set('description')} />
              <Textarea label="Uses" value={f.uses || ''} onChange={set('uses')} />
              <Textarea label="Dosage" value={f.dosage || ''} onChange={set('dosage')} />
              <Textarea label="Side effects" value={f.side_effects || ''} onChange={set('side_effects')} />
              <Textarea label="Safety info" value={f.safety_info || ''} onChange={set('safety_info')} />
              <div className="space-y-3">
                <Input label="Storage" placeholder="Below 25°C, dry place" value={f.storage || ''} onChange={set('storage')} />
                <div><label className="label">Prescription required (Rx)</label>
                  <div className="flex h-10 items-center justify-between rounded-[10px] border border-line px-3 text-[13px]">{f.rx_required ? <Badge tone="bad">Rx — prescription zaroori</Badge> : 'No — OTC medicine'}<Toggle checked={f.rx_required} onChange={set('rx_required')} /></div>
                </div>
              </div>
            </div>
          </Section>
        </div>
        <div>
          <Section icon={ImageIcon} title="Product images">
            <Reorder.Group axis="x" values={f.images} onReorder={(v) => setF({ ...f, images: v })} className="mb-3 flex flex-wrap gap-2">
              {f.images.map((u, i) => (
                <Reorder.Item key={u} value={u} className="relative h-[76px] w-[76px] cursor-grab overflow-hidden rounded-xl border border-line bg-p-mint">
                  <img src={u} alt="" className="h-full w-full object-cover" draggable={false} />
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-p px-1 text-[9px] font-bold text-white">COVER</span>}
                  <button onClick={() => setF({ ...f, images: f.images.filter((x) => x !== u) })} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-bad"><X size={12} /></button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {f.images.length < 6 && <ImageDrop multiple busy={uploading} onFiles={upload} label="Images add karein" hint="Max 6 · drag karke order badlein · pehli image cover" />}
          </Section>
          <Section icon={Box} title={id ? 'Stock rules' : 'Stock & batch'}>
            <div className="grid grid-cols-2 gap-3">
              {!id && (<>
                <Input label="Opening stock" type="number" value={stock.qty} onChange={(e) => setStock({ ...stock, qty: e.target.value })} />
                <Input label="Batch no." value={stock.batch_no} onChange={(e) => setStock({ ...stock, batch_no: e.target.value })} />
                <Input label="Expiry date" type="date" value={stock.expiry_date} onChange={(e) => setStock({ ...stock, expiry_date: e.target.value })} />
                <Input label="Cost price (₹)" type="number" value={stock.cost_price} onChange={(e) => setStock({ ...stock, cost_price: e.target.value })} />
              </>)}
              <Input label="Low-stock alert at" type="number" value={f.low_stock_threshold} onChange={set('low_stock_threshold')} />
              <Input label="Max qty per order" type="number" value={f.max_order_qty} onChange={set('max_order_qty')} />
            </div>
            {id && <p className="mt-3 text-[12px] text-mut">Stock add/remove “Inventory” page se batch ke saath hota hai.</p>}
          </Section>
          <Section icon={Eye} title="Visibility">
            {[['is_active', 'Active (app me dikhe)'], ['in_spotlight', 'Show in “In the Spotlight”'], ['is_featured', 'Featured on home']].map(([k, l]) => (
              <div key={k} className="flex items-center justify-between py-2 text-[13px]">{l}<Toggle checked={f[k]} onChange={set(k)} /></div>
            ))}
          </Section>
        </div>
      </div>
    </>
  );
}
