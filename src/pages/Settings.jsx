import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, FileText, Package, ShieldCheck, Smartphone, Store, Truck, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { Badge, Button, Card, Input, PageHeader, Shimmer, Toggle, cx } from '../components/ui';

const TABS = [['delivery', 'Delivery', Truck], ['store', 'Store & legal', Store], ['app', 'App', Smartphone], ['integrations', 'Integrations', CreditCard]];

export default function Settings() {
  const { can } = useAuth();
  const { data, loading, setData } = useFetch('/settings');
  const [tab, setTab] = useState('delivery');
  const [s, setS] = useState(null);
  const [pin, setPin] = useState('');
  const { busy, run } = useAction();
  useEffect(() => { if (data) setS(JSON.parse(JSON.stringify(data))); }, [data]);
  if (loading || !s) return <Shimmer className="h-[520px]" />;

  const edit = can('settings', 'edit');
  const setD = (mode, k, v) => setS({ ...s, delivery: { ...s.delivery, [mode]: { ...s.delivery[mode], [k]: v } } });
  const save = async (key) => {
    const body = key === 'delivery' ? {
      ...s.delivery,
      home: { ...s.delivery.home, charge: Number(s.delivery.home.charge), free_above: s.delivery.home.free_above === '' ? null : Number(s.delivery.home.free_above) },
      courier: { ...s.delivery.courier, charge: Number(s.delivery.courier.charge), free_above: s.delivery.courier.free_above === '' ? null : Number(s.delivery.courier.free_above) },
      pickup: { ...s.delivery.pickup, charge: Number(s.delivery.pickup.charge || 0) },
    } : s[key];
    const r = await run(() => api.put(`/settings/${key}`, body));
    if (r) setData({ ...data, ...r });
  };

  const ModeCard = ({ mode, icon: Icon, title, sub, children, badge }) => (
    <div className="card mb-3 p-4">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-p-mint text-p"><Icon size={17} /></span>
        <div className="flex-1"><b className="text-[13.5px]">{title}</b> {badge}<div className="text-[12px] text-mut">{sub}</div></div>
        <Toggle checked={s.delivery[mode].enabled} disabled={!edit} onChange={(v) => setD(mode, 'enabled', v)} /></div>
      <div className={cx('mt-3 grid gap-3 md:grid-cols-4', !s.delivery[mode].enabled && 'pointer-events-none opacity-50')}>{children}</div>
    </div>
  );

  return (
    <>
      <PageHeader title="Settings" subtitle="Admin · Delivery, store, app aur integrations" />
      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <div className="card h-fit p-2">
          {TABS.map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('relative mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium', tab === k ? 'text-p' : 'text-ink-2 hover:bg-bg')}>
              {tab === k && <motion.span layoutId="set-tab" className="absolute inset-0 rounded-lg bg-p-mint" />}<I size={15} className="relative" /><span className="relative">{l}</span>
            </button>
          ))}
        </div>
        <div>
          {tab === 'delivery' && (<>
            <ModeCard mode="home" icon={Truck} title="Own delivery" sub="Apne delivery boys se, same day">
              <Input label="Delivery charge ₹" type="number" value={s.delivery.home.charge} onChange={(e) => setD('home', 'charge', e.target.value)} />
              <Input label="Free delivery above ₹" type="number" value={s.delivery.home.free_above ?? ''} onChange={(e) => setD('home', 'free_above', e.target.value)} />
              <Input label="ETA text (app me)" value={s.delivery.home.eta_text} onChange={(e) => setD('home', 'eta_text', e.target.value)} />
              <Input label="Same-day cutoff" type="time" value={s.delivery.home.same_day_cutoff || '17:00'} onChange={(e) => setD('home', 'same_day_cutoff', e.target.value)} />
              <div className="md:col-span-4"><label className="label">Serviceable pincodes <span className="font-normal text-mut">(khaali = sab jagah)</span></label>
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] border border-line p-1.5">
                  {s.delivery.serviceable_pincodes.map((p) => <span key={p} className="chip bg-p-mint text-p">{p}<button onClick={() => setS({ ...s, delivery: { ...s.delivery, serviceable_pincodes: s.delivery.serviceable_pincodes.filter((x) => x !== p) } })}><X size={11} /></button></span>)}
                  <input className="min-w-[120px] flex-1 px-2 text-[13px] outline-none" placeholder="Pincode + Enter" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && pin.length === 6 && !s.delivery.serviceable_pincodes.includes(pin)) { setS({ ...s, delivery: { ...s.delivery, serviceable_pincodes: [...s.delivery.serviceable_pincodes, pin] } }); setPin(''); } }} />
                </div>
              </div>
            </ModeCard>
            <ModeCard mode="pickup" icon={Store} title="Store pickup" sub="Customer khud store se le jaye">
              <Input label="Ready in (app me)" value={s.delivery.pickup.ready_in_text} onChange={(e) => setD('pickup', 'ready_in_text', e.target.value)} />
            </ModeCard>
            <ModeCard mode="courier" icon={Package} title="Courier – Shiprocket" sub="Serviceable pincodes ke bahar, pure India" badge={s.integrations?.shiprocket ? <Badge tone="ok">API connected</Badge> : <Badge>Manual AWB</Badge>}>
              <Input label="Charge ₹" type="number" value={s.delivery.courier.charge} onChange={(e) => setD('courier', 'charge', e.target.value)} />
              <Input label="Free above ₹" type="number" value={s.delivery.courier.free_above ?? ''} onChange={(e) => setD('courier', 'free_above', e.target.value)} />
              <Input label="ETA text" value={s.delivery.courier.eta_text} onChange={(e) => setD('courier', 'eta_text', e.target.value)} />
            </ModeCard>
            {edit && <div className="flex justify-end"><Button loading={busy} onClick={() => save('delivery')}>Save delivery settings</Button></div>}
          </>)}
          {tab === 'store' && (
            <Card title={<span className="flex items-center gap-2"><ShieldCheck size={15} />Store & legal (invoice par print hota hai)</span>}>
              <div className="grid gap-3 md:grid-cols-2">
                {[['name', 'Store name'], ['drug_license_no', 'Drug License No.'], ['gstin', 'GSTIN'], ['pharmacist_name', 'Registered pharmacist'], ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode'], ['phone', 'Phone'], ['email', 'Email']].map(([k, l]) => (
                  <Input key={k} label={l} disabled={!edit} value={s.store[k] || ''} onChange={(e) => setS({ ...s, store: { ...s.store, [k]: e.target.value } })} />
                ))}
              </div>
              {edit && <div className="mt-4 flex justify-end"><Button loading={busy} onClick={() => save('store')}>Save</Button></div>}
            </Card>
          )}
          {tab === 'app' && (
            <Card title="App settings">
              <div className="grid gap-3 md:grid-cols-2">
                {[['min_android_version', 'Min Android version (force update)'], ['min_ios_version', 'Min iOS version'], ['support_phone', 'Support phone'], ['support_whatsapp', 'Support WhatsApp'], ['terms_url', 'Terms URL'], ['privacy_url', 'Privacy policy URL']].map(([k, l]) => (
                  <Input key={k} label={l} disabled={!edit} value={s.app[k] || ''} onChange={(e) => setS({ ...s, app: { ...s.app, [k]: e.target.value } })} />
                ))}
              </div>
              {edit && <div className="mt-4 flex justify-end"><Button loading={busy} onClick={() => save('app')}>Save</Button></div>}
            </Card>
          )}
          {tab === 'integrations' && (
            <div className="grid gap-3 md:grid-cols-3">
              <Card title="Razorpay"><Badge tone={s.integrations.razorpay_mode === 'live' ? 'ok' : 'warn'}>{s.integrations.razorpay_mode.toUpperCase()}</Badge><p className="mt-2 text-[12px] text-mut">Keys server ki .env file me hain (secret kabhi browser me nahi aata).</p></Card>
              <Card title="Firebase (FCM)"><Badge tone={s.integrations.fcm ? 'ok' : 'bad'}>{s.integrations.fcm ? 'Connected' : 'Not configured'}</Badge><p className="mt-2 text-[12px] text-mut">Service account JSON server par FIREBASE_SERVICE_ACCOUNT path par.</p></Card>
              <Card title="Shiprocket"><Badge tone={s.integrations.shiprocket ? 'ok' : 'mut'}>{s.integrations.shiprocket ? 'Connected' : 'Optional'}</Badge><p className="mt-2 text-[12px] text-mut">SHIPROCKET_EMAIL / PASSWORD .env me.</p></Card>
              <Card title="Invoice" className="md:col-span-3"><div className="flex items-center gap-2 text-[13px]"><FileText size={15} className="text-mut" />GST invoice PDF har paid order ke liye auto-generate hota hai (Store & legal details use hoti hain).</div></Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
