import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, ShieldAlert } from 'lucide-react';
import { api, errMsg } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Input, PageHeader, Avatar, Badge } from '../components/ui';

export default function Account() {
  const { admin, logout } = useAuth();
  const [f, setF] = useState({ current_password: '', new_password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (f.new_password !== f.confirm) return toast.error('Naya password match nahi kar raha');
    setBusy(true);
    try { const r = await api.post('/auth/change-password', { current_password: f.current_password, new_password: f.new_password }); toast.success(r.data.message); logout(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-2xl">
      <PageHeader title="My account" subtitle="Profile aur password" />
      {admin?.must_change_password && (
        <div className="mb-4 flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-[13px] text-[#7A5200]"><ShieldAlert size={18} />Security ke liye pehle apna temporary password badlein.</div>
      )}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={admin?.name} size={56} />
          <div><div className="font-display text-[18px] font-extrabold">{admin?.name}</div><div className="text-[13px] text-mut">{admin?.email}</div><Badge tone="p" className="mt-1">{admin?.role}</Badge></div>
        </div>
      </Card>
      <Card title="Change password" className="mt-4">
        <div className="grid gap-3">
          <Input label="Current password" type="password" icon={Lock} value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} />
          <Input label="New password" type="password" icon={Lock} hint="8+ characters, capital + small letter, number aur symbol" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} />
          <Input label="Confirm new password" type="password" icon={Lock} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
          <div><Button loading={busy} onClick={save}>Update password</Button></div>
        </div>
      </Card>
    </div>
  );
}
