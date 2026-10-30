import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, Lock, RefreshCw } from 'lucide-react';
import { api, errMsg } from '../api/client';
import { useFetch } from '../utils/useFetch';
import { NAV } from '../components/Layout';
import { Avatar, Button, Card, Checkbox, IconBtn, Input, Modal, PageHeader, Select, Shimmer, cx } from '../components/ui';

const ACTIONS = ['view', 'create', 'edit', 'delete'];

export function PermissionMatrix({ modules, value, onChange }) {
  const has = (m, a) => (value[m] || []).includes(a);
  const toggle = (m, a, on) => {
    let acts = new Set(value[m] || []);
    if (on) { acts.add(a); if (a !== 'view' && modules.find((x) => x.key === m)?.actions.includes('view')) acts.add('view'); }
    else { acts.delete(a); if (a === 'view') acts = new Set(); }
    const next = { ...value, [m]: [...acts] };
    if (!next[m].length) delete next[m];
    onChange(next);
  };
  const allOn = modules.every((m) => m.actions.every((a) => has(m.key, a)));
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full">
        <thead><tr><th className="th">Module</th>{ACTIONS.map((a) => <th key={a} className="th text-center capitalize">{a}</th>)}
          <th className="th text-right"><Checkbox checked={allOn} label="All" onChange={(v) => onChange(v ? Object.fromEntries(modules.map((m) => [m.key, [...m.actions]])) : {})} /></th></tr></thead>
        <tbody>
          {modules.map((m) => {
            const n = (value[m.key] || []).length;
            return (
              <tr key={m.key} className="hover:bg-[#F8FBFA]">
                <td className="td !py-2 font-semibold">{m.label}</td>
                {ACTIONS.map((a) => <td key={a} className="td !py-2 text-center">{m.actions.includes(a) ? <span className="inline-flex"><Checkbox checked={has(m.key, a)} onChange={(v) => toggle(m.key, a, v)} /></span> : <span className="text-[#CBD5D3]">–</span>}</td>)}
                <td className="td !py-2 text-right"><span className={cx('chip', n === 0 ? 'bg-[#EEF2F1] text-mut' : n === m.actions.length ? 'bg-ok-soft text-ok' : 'bg-blue-soft text-blue')}>{n === 0 ? 'No access' : n === m.actions.length ? 'Full' : 'Partial'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SidebarPreview({ perms, name, role }) {
  const can = (m) => (perms[m] || []).includes('view');
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-p-side to-p-side2 p-3 text-[#BFD6D2] shadow-pop">
      <div className="mb-3 px-1 text-[12px] font-bold text-white">AK Sharma Medicos</div>
      {NAV.map((g) => {
        const items = g.items.filter((i) => can(i.perm));
        if (!items.length) return null;
        return (<div key={g.group}><div className="mb-1 mt-2 px-2 text-[9px] font-bold uppercase tracking-widest text-[#6F9590]">{g.group}</div>
          {items.map((i) => <motion.div layout key={i.to} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px]"><i.icon size={14} />{i.label}</motion.div>)}</div>);
      })}
      {!Object.keys(perms).length && <p className="px-2 py-6 text-center text-[12px]">Koi menu nahi — kam se kam ek “View” permission do</p>}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/[.07] p-2"><Avatar name={name || '?'} size={26} /><div className="text-[11px] leading-tight"><div className="font-semibold text-white">{name || 'Staff name'}</div>{role} · Staff</div></div>
    </div>
  );
}

export default function StaffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: modules } = useFetch('/permissions/modules');
  const { data: roles } = useFetch('/roles');
  const [f, setF] = useState({ name: '', email: '', phone: '', role_id: '', permissions: {}, is_active: true, password: '', send_email: true, force_change: true });
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/staff/${id}`).then((r) => { const s = r.data.data; setF((x) => ({ ...x, ...s, phone: s.phone || '', role_id: s.role_id || '' })); }).catch((e) => toast.error(errMsg(e))).finally(() => setLoading(false));
  }, [id]);

  const pickRole = (rid) => {
    const r = roles?.find((x) => x.id === Number(rid));
    setF({ ...f, role_id: rid, permissions: r ? JSON.parse(JSON.stringify(r.permissions)) : f.permissions });
  };
  const gen = () => {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const rnd = (n) => Array.from(crypto.getRandomValues(new Uint32Array(n))).map((x) => c[x % c.length]).join('');
    setF({ ...f, password: `${rnd(3)}#${rnd(4)}9a` });
  };
  const save = async () => {
    setBusy(true);
    try {
      const body = { name: f.name, email: f.email, phone: f.phone || null, role_id: f.role_id ? Number(f.role_id) : null, permissions: f.permissions, is_active: f.is_active };
      if (id) { const r = await api.put(`/staff/${id}`, body); toast.success(r.data.message); navigate('/staff'); }
      else {
        const r = await api.post('/staff', { ...body, password: f.password || undefined, send_email: f.send_email, force_change: f.force_change });
        toast.success(r.data.message);
        setCreated({ email: f.email, password: f.password || r.data.data.temporary_password });
      }
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const roleName = roles?.find((r) => r.id === Number(f.role_id))?.name || 'Custom';

  if (loading) return <Shimmer className="h-[500px]" />;
  return (
    <>
      <PageHeader back={<IconBtn icon={ArrowLeft} onClick={() => navigate('/staff')} />} title={id ? 'Edit staff' : 'Add staff member'} subtitle="Admin · Staff"
        actions={<><Button variant="outline" onClick={() => navigate('/staff')}>Cancel</Button><Button icon={Check} loading={busy} disabled={!f.name || !f.email} onClick={save}>{id ? 'Save changes' : 'Save & send invite'}</Button></>} />
      <div className="grid gap-4 xl:grid-cols-[300px_1fr_220px]">
        <Card title="Staff details">
          <div className="space-y-3">
            <Input label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input label="Login email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input label="Phone" value={f.phone} maxLength={10} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} />
            {!id && <Input label="Password" icon={Lock} value={f.password} placeholder="Khaali = auto generate" onChange={(e) => setF({ ...f, password: e.target.value })}
              right={<button type="button" onClick={gen} className="flex items-center gap-1 text-[11.5px] font-semibold text-p"><RefreshCw size={12} />Generate</button>} hint="8+ chars, A-z, number, symbol" />}
            <Select label="Role preset" value={f.role_id} onChange={(e) => pickRole(e.target.value)} placeholder="Custom" options={(roles || []).map((r) => ({ value: r.id, label: r.name }))} />
            {!id && <><Checkbox checked={f.send_email} onChange={(v) => setF({ ...f, send_email: v })} label="Login details email par bhejein" />
              <Checkbox checked={f.force_change} onChange={(v) => setF({ ...f, force_change: v })} label="Pehle login par password badalna zaroori" /></>}
          </div>
        </Card>
        <Card noPad title={`Permissions · ${roleName}`}><div className="p-3"><PermissionMatrix modules={modules || []} value={f.permissions} onChange={(p) => setF({ ...f, permissions: p })} /></div></Card>
        <div><div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mut">{f.name ? f.name.split(' ')[0] : 'Staff'} ko ye dikhega</div><SidebarPreview perms={f.permissions} name={f.name} role={roleName} />
          <p className="mt-2 text-[11.5px] leading-relaxed text-mut">Jinki permission nahi, wo menu chhup jaate hain. Backend API bhi block karta hai.</p></div>
      </div>
      <Modal open={!!created} onClose={() => navigate('/staff')} title="Staff account ban gaya 🎉" width={420} footer={<Button onClick={() => { navigator.clipboard.writeText(`${created.email} / ${created.password}`); navigate('/staff'); }}>Copy & done</Button>}>
        {created && <div className="text-[13px]"><p>Staff “Staff” tab se login karega:</p><div className="mt-3 space-y-1 rounded-xl bg-p-mint p-4 font-mono text-[13px] text-p"><div>{created.email}</div><div className="text-[18px] font-bold">{created.password}</div></div><p className="mt-2 text-[12px] text-mut">Password sirf ek baar dikh raha hai.</p></div>}
      </Modal>
    </>
  );
}
