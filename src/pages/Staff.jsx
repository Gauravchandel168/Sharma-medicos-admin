import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, KeyRound, Lock, Package, Pencil, Plus, ShieldCheck, Trash2, Truck, Users } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { timeAgo, dt } from '../utils/format';
import { Avatar, Badge, Button, Card, Confirm, Empty, IconBtn, Modal, PageHeader, Pagination, TableSkeleton, Tabs, Toggle, Input } from '../components/ui';
import { PermissionMatrix } from './StaffForm';

const ROLE_ICON = { Manager: [Users, 'blue'], Pharmacist: [FileText, 'ok'], Packer: [Package, 'warn'], Delivery: [Truck, 'vio'] };

export default function Staff() {
  const { can, admin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('staff');
  const staff = useFetch('/staff');
  const roles = useFetch('/roles');
  const { data: modules } = useFetch('/permissions/modules');
  const [ap, setAp] = useState(1);
  const activity = useFetch(tab === 'activity' ? '/activity' : null, { page: ap });
  const [del, setDel] = useState(null);
  const [pwd, setPwd] = useState(null);
  const [role, setRole] = useState(null);
  const { busy, run } = useAction();

  const saveRole = async () => {
    const body = { name: role.name, description: role.description, permissions: role.permissions, apply_to_staff: role.apply_to_staff };
    if (await run(() => (role.id ? api.put(`/roles/${role.id}`, body) : api.post('/roles', body)))) { setRole(null); roles.reload(true); staff.reload(true); }
  };

  return (
    <>
      <PageHeader title="Staff & roles" subtitle="Admin · Staff ko access aap decide karte hain"
        actions={<>{can('staff', 'create') && <Button variant="outline" icon={Plus} onClick={() => setRole({ name: '', description: '', permissions: {} })}>New role</Button>}
          {can('staff', 'create') && <Button icon={Plus} onClick={() => navigate('/staff/new')}>Add staff</Button>}</>} />
      <Tabs className="mb-3" value={tab} onChange={setTab} tabs={[{ value: 'staff', label: 'Staff', count: staff.data?.length }, { value: 'roles', label: 'Roles', count: roles.data?.length }, { value: 'activity', label: 'Activity log' }]} />

      {tab === 'staff' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <Card noPad>
            <table className="w-full">
              <thead><tr>{['Staff member', 'Role', 'Last login', 'Active', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              {staff.loading ? <TableSkeleton cols={5} /> : <tbody>
                {staff.data?.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <td className="td"><div className="flex items-center gap-2.5"><Avatar name={s.name} size={32} /><div><div className="font-semibold">{s.name}{s.id === admin.id && <span className="ml-1 text-[11px] text-mut">(you)</span>}</div><div className="text-[11.5px] text-mut">{s.email}</div></div></div></td>
                    <td className="td"><Badge tone={s.is_super_admin ? 'bad' : (ROLE_ICON[s.role]?.[1] || 'p')}>{s.role}</Badge>{s.locked && <Badge tone="warn" icon={Lock} className="ml-1">Locked</Badge>}</td>
                    <td className="td"><span className="flex items-center gap-1.5 text-[12.5px]"><span className={`h-2 w-2 rounded-full ${s.last_login_at && Date.now() - new Date(s.last_login_at) < 3600e3 ? 'bg-ok' : 'bg-[#B7C3C1]'}`} />{s.last_login_at ? timeAgo(s.last_login_at) : 'Never'}</span></td>
                    <td className="td"><Toggle checked={s.is_active} disabled={s.is_super_admin || !can('staff', 'edit') || s.id === admin.id} onChange={async (v) => { if (await run(() => api.patch(`/staff/${s.id}/status`, { is_active: v }))) staff.reload(true); }} /></td>
                    <td className="td">{s.is_super_admin ? <span className="text-mut">—</span> : <div className="flex gap-1.5">
                      {can('staff', 'edit') && <IconBtn icon={Pencil} title="Edit permissions" onClick={() => navigate(`/staff/${s.id}`)} />}
                      {can('staff', 'edit') && <IconBtn icon={KeyRound} title="Reset password" onClick={async () => { const r = await run(() => api.post(`/staff/${s.id}/reset-password`)); if (r) setPwd({ name: s.name, email: s.email, password: r.temporary_password }); }} />}
                      {can('staff', 'delete') && <IconBtn icon={Trash2} danger onClick={() => setDel(s)} />}
                    </div>}</td>
                  </motion.tr>
                ))}
              </tbody>}
            </table>
            <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-[12px] text-mut"><Lock size={13} />Staff apne email + password se “Staff” tab me login karta hai. Inactive karte hi turant logout.</div>
          </Card>
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mut">Roles & presets</div>
            <div className="card mb-2 flex items-center gap-3 p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-bad-soft text-bad"><ShieldCheck size={16} /></span><div className="flex-1"><b className="text-[13px]">Super Admin</b><div className="text-[11.5px] text-mut">Full access · sab kuch</div></div><Badge>1</Badge></div>
            {roles.data?.map((r) => { const [I, t] = ROLE_ICON[r.name] || [Users, 'p']; return (
              <button key={r.id} onClick={() => can('staff', 'edit') && setRole({ ...r, apply_to_staff: false })} className="card mb-2 flex w-full items-center gap-3 p-3 text-left hover:border-p-light">
                <Badge tone={t} className="!grid h-9 w-9 place-items-center !rounded-xl !p-0"><I size={15} /></Badge>
                <div className="flex-1"><b className="text-[13px]">{r.name}</b><div className="text-[11.5px] text-mut">{r.description}</div></div><Badge>{r.staff_count}</Badge>
              </button>
            ); })}
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.data?.map((r) => (
            <Card key={r.id} title={r.name} actions={can('staff', 'edit') && <div className="flex gap-1.5"><IconBtn icon={Pencil} onClick={() => setRole({ ...r, apply_to_staff: false })} />{!r.is_system && can('staff', 'delete') && <IconBtn icon={Trash2} danger onClick={async () => { if (await run(() => api.delete(`/roles/${r.id}`))) roles.reload(true); }} />}</div>}>
              <p className="mb-3 text-[12.5px] text-mut">{r.description} · {r.staff_count} staff</p>
              <div className="flex flex-wrap gap-1.5">{Object.entries(r.permissions).map(([m, acts]) => <Badge key={m} tone="p">{modules?.find((x) => x.key === m)?.label || m}: {acts.join('/')}</Badge>)}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <Card noPad>
          <table className="w-full">
            <thead><tr>{['Who', 'Action', 'Entity', 'Details', 'When'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            {activity.loading ? <TableSkeleton cols={5} /> : <tbody>
              {activity.data?.map((a) => (
                <tr key={a.id}><td className="td"><div className="flex items-center gap-2"><Avatar name={a.admin_name || '?'} size={24} />{a.admin_name || 'System'}</div></td>
                  <td className="td"><Badge tone="p">{a.action}</Badge></td><td className="td">{a.entity} #{a.entity_id}</td>
                  <td className="td max-w-[360px] truncate font-mono text-[11px] text-mut">{a.meta ? JSON.stringify(a.meta) : ''}</td><td className="td text-[12px] text-mut">{dt(a.created_at)}</td></tr>
              ))}
              {!activity.data?.length && <tr><td colSpan={5}><Empty title="Koi activity nahi" /></td></tr>}
            </tbody>}
          </table>
          <Pagination meta={activity.meta} onPage={setAp} />
        </Card>
      )}

      <Confirm open={!!del} danger title="Staff delete karein?" confirmText="Delete" loading={busy} onClose={() => setDel(null)} message={<>{del?.name} ka account hamesha ke liye delete ho jayega.</>}
        onConfirm={async () => { if (await run(() => api.delete(`/staff/${del.id}`))) { setDel(null); staff.reload(true); } }} />
      <Modal open={!!pwd} onClose={() => setPwd(null)} title="Naya temporary password" width={420} footer={<Button onClick={() => { navigator.clipboard.writeText(pwd.password); setPwd(null); }}>Copy & close</Button>}>
        {pwd && <div className="text-[13px]"><p>{pwd.name} ({pwd.email}) ko email bhi bhej diya gaya hai.</p><div className="mt-3 rounded-xl bg-p-mint p-4 text-center font-mono text-[20px] font-bold tracking-wider text-p">{pwd.password}</div><p className="mt-2 text-[12px] text-mut">Ye password sirf ek baar dikhega. Pehle login par staff ko badalna padega.</p></div>}
      </Modal>
      <Modal open={!!role} onClose={() => setRole(null)} title={role?.id ? `Edit role · ${role.name}` : 'New role'} width={760}
        footer={<><Button variant="outline" onClick={() => setRole(null)}>Cancel</Button><Button loading={busy} disabled={!role?.name} onClick={saveRole}>Save role</Button></>}>
        {role && <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Input label="Role name" value={role.name} onChange={(e) => setRole({ ...role, name: e.target.value })} /><Input label="Description" value={role.description || ''} onChange={(e) => setRole({ ...role, description: e.target.value })} /></div>
          <PermissionMatrix modules={modules || []} value={role.permissions} onChange={(p) => setRole({ ...role, permissions: p })} />
          {role.id && <label className="flex items-center gap-2 text-[13px]"><Toggle checked={role.apply_to_staff} onChange={(v) => setRole({ ...role, apply_to_staff: v })} />Is role ke saare staff par bhi ye permissions lagao</label>}
        </div>}
      </Modal>
    </>
  );
}
