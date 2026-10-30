import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CalendarClock, Image as ImageIcon, Send, X } from 'lucide-react';
import { api, uploadImages } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { dt } from '../utils/format';
import { Badge, Button, Card, Empty, ImageDrop, Input, PageHeader, Pagination, Select, TableSkeleton, Textarea, cx } from '../components/ui';

const AUD = { all: 'All customers', customers: 'Specific customer', pincode: 'By pincode / city', category_buyers: 'Bought in category' };

export default function Notifications() {
  const { can } = useAuth();
  const [sp] = useSearchParams();
  const presetUser = sp.get('user');
  const [f, setF] = useState({ title: '', body: '', image_url: '', action_type: 'none', action_value: '', aud: presetUser ? 'customers' : 'all', user_ids: presetUser || '', prefixes: '', category_id: '' });
  const [count, setCount] = useState(null);
  const [page, setPage] = useState(1);
  const [up, setUp] = useState(false);
  const { data: cats } = useFetch('/categories');
  const camp = useFetch('/notifications/campaigns', { page });
  const { busy, run } = useAction();

  const audience = () => {
    if (f.aud === 'customers') return { type: 'customers', user_ids: f.user_ids.split(/[,\s]+/).filter(Boolean).map(Number) };
    if (f.aud === 'pincode') return { type: 'pincode', prefixes: f.prefixes.split(/[,\s]+/).filter(Boolean) };
    if (f.aud === 'category_buyers') return { type: 'category_buyers', category_id: Number(f.category_id) };
    return { type: 'all' };
  };
  useEffect(() => {
    const t = setTimeout(() => { api.post('/notifications/preview-audience', { audience: audience() }).then((r) => setCount(r.data.data.count)).catch(() => setCount(null)); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.aud, f.user_ids, f.prefixes, f.category_id]);

  const send = async () => {
    const r = await run(() => api.post('/notifications/send', { title: f.title, body: f.body, image_url: f.image_url || null, action_type: f.action_type, action_value: f.action_value || null, audience: audience() }));
    if (r) { setF({ ...f, title: '', body: '', image_url: '' }); camp.reload(true); }
  };

  return (
    <>
      <PageHeader title="Push notifications" subtitle="Marketing · Firebase Cloud Messaging" />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_280px]">
        {can('notifications', 'create') ? (
          <Card title="Send push notification">
            <div className="space-y-3">
              <Input label="Title" maxLength={160} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Flash sale – 30% off on devices ⚡" />
              <Textarea label="Message" maxLength={500} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Thermometer, BP monitor aur nebulizer par sirf aaj…" />
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="label">Image (optional)</label>
                  {f.image_url ? <div className="flex items-center gap-2"><img src={f.image_url} className="h-10 w-16 rounded object-cover" alt="" /><Button size="sm" variant="danger" icon={X} onClick={() => setF({ ...f, image_url: '' })}>Remove</Button></div>
                    : <ImageDrop className="!py-2.5" busy={up} onFiles={async (fl) => { setUp(true); try { const [r] = await uploadImages(fl, '/uploads'); setF((x) => ({ ...x, image_url: r.url })); } finally { setUp(false); } }} label="Image add karein" hint="" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select label="Tap karne par kholo" value={f.action_type} onChange={(e) => setF({ ...f, action_type: e.target.value })} options={[{ value: 'none', label: 'App home' }, { value: 'product', label: 'Product' }, { value: 'category', label: 'Category' }, { value: 'url', label: 'URL' }]} />
                  {f.action_type === 'category' ? <Select label="Category" value={f.action_value} onChange={(e) => setF({ ...f, action_value: e.target.value })} placeholder="Select…" options={(cats || []).map((c) => ({ value: c.id, label: c.name }))} />
                    : <Input label="Value" disabled={f.action_type === 'none'} value={f.action_value} onChange={(e) => setF({ ...f, action_value: e.target.value })} placeholder={f.action_type === 'product' ? 'Product ID' : 'https://'} />}
                </div>
              </div>
              <div><label className="label">Audience</label>
                <div className="flex flex-wrap gap-2">{Object.entries(AUD).map(([k, l]) => (
                  <button key={k} onClick={() => setF({ ...f, aud: k })} className={cx('rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition', f.aud === k ? 'border-p bg-p text-white' : 'border-line bg-white text-ink-2 hover:border-p-light')}>{l}</button>
                ))}</div>
              </div>
              {f.aud === 'customers' && <Input label="Customer IDs" hint="Comma se alag (Customers page se)" value={f.user_ids} onChange={(e) => setF({ ...f, user_ids: e.target.value })} />}
              {f.aud === 'pincode' && <Input label="Pincode / prefix" hint="302 = poora Jaipur, 302006 = ek area" value={f.prefixes} onChange={(e) => setF({ ...f, prefixes: e.target.value })} />}
              {f.aud === 'category_buyers' && <Select label="Category" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} placeholder="Select…" options={(cats || []).map((c) => ({ value: c.id, label: c.name }))} />}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button icon={Send} loading={busy} disabled={!f.title || !f.body || !count} onClick={send}>Send now{count ? ` · ${count}` : ''}</Button>
                <Badge tone={count ? 'p' : 'mut'}>{count === null ? 'Counting…' : `${count} customers`}</Badge>
                <span className="ml-auto text-[12px] text-mut">via Firebase Cloud Messaging</span>
              </div>
            </div>
          </Card>
        ) : <Card><Empty title="Notification bhejne ki permission nahi" /></Card>}

        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mut">Live preview</div>
          <div className="rounded-[26px] bg-gradient-to-b from-[#2D3C55] to-[#14202F] p-4 text-white shadow-pop">
            <div className="text-center font-display text-[38px] font-light">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
            <div className="text-center text-[11px] opacity-70">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <motion.div key={f.title + f.body} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-5 rounded-2xl bg-white/90 p-3 text-ink">
              <div className="flex items-center gap-1.5 text-[10px] text-mut"><span className="grid h-4 w-4 place-items-center rounded bg-p text-white"><Bell size={9} /></span>AK SHARMA MEDICOS<span className="ml-auto">now</span></div>
              <div className="mt-1.5 flex gap-2"><div className="flex-1"><div className="text-[12.5px] font-bold">{f.title || 'Notification title'}</div><div className="mt-0.5 line-clamp-3 text-[11.5px] text-ink-2">{f.body || 'Message yahan dikhega…'}</div></div>
                {f.image_url ? <img src={f.image_url} className="h-11 w-11 rounded-lg object-cover" alt="" /> : <div className="grid h-11 w-11 place-items-center rounded-lg bg-p-mint text-p"><ImageIcon size={16} /></div>}</div>
            </motion.div>
          </div>
          <Card className="mt-4" title="Automatic notifications">
            {['Order status change', 'Prescription approved / rejected', 'Back in stock (Notify me)', 'Price drop on wishlist', 'Refund processed'].map((t) => (
              <div key={t} className="flex items-center justify-between py-1.5 text-[12.5px]">{t}<Badge tone="ok">ON</Badge></div>
            ))}
          </Card>
        </div>
      </div>

      <Card noPad className="mt-4" title={<span className="flex items-center gap-2"><CalendarClock size={15} />Sent history</span>}>
        <table className="w-full">
          <thead><tr>{['Campaign', 'Audience', 'Sent', 'Opened', 'By', 'Date'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          {camp.loading ? <TableSkeleton cols={6} rows={3} /> : <tbody>
            {camp.data?.map((c) => (
              <tr key={c.id}><td className="td"><div className="font-semibold">{c.title}</div><div className="max-w-[360px] truncate text-[11.5px] text-mut">{c.body}</div></td>
                <td className="td text-mut">{AUD[c.audience?.type]}</td><td className="td">{c.sent_count}</td><td className="td font-bold text-ok">{c.open_rate}%</td><td className="td text-mut">{c.created_by_name}</td><td className="td text-[12px] text-mut">{dt(c.created_at)}</td></tr>
            ))}
            {!camp.data?.length && <tr><td colSpan={6}><Empty icon={Send} title="Abhi tak koi campaign nahi" /></td></tr>}
          </tbody>}
        </table>
        <Pagination meta={camp.meta} onPage={setPage} />
      </Card>
    </>
  );
}
