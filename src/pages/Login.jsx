import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Users, ArrowRight, ArrowLeft, KeyRound, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { API_URL, errMsg } from '../api/client';
import { Button, Checkbox, Input, Tabs, cx } from '../components/ui';

const pub = (path, body) => axios.post(`${API_URL}/admin/auth${path}`, body, { withCredentials: true });

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function Forgot({ onBack, defaultEmail }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(defaultEmail || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => { if (timer > 0) { const t = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(t); } }, [timer]);

  const send = async () => {
    setBusy(true);
    try { const r = await pub('/forgot-password', { email }); toast.success(r.data.message); setStep(2); setTimer(r.data.data.resend_after || 45); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true);
    try { const r = await pub('/verify-otp', { email, otp: otp.join('') }); setToken(r.data.data.reset_token); setStep(3); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (pw !== pw2) return toast.error('Dono password same hone chahiye');
    setBusy(true);
    try { const r = await pub('/reset-password', { reset_token: token, new_password: pw }); toast.success(r.data.message); onBack(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const s = strength(pw);

  return (
    <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-[13px] font-semibold text-mut hover:text-ink"><ArrowLeft size={15} />Login par wapas</button>
      <div className="mb-1 flex gap-1.5">{[1, 2, 3].map((i) => <div key={i} className={cx('h-1 flex-1 rounded-full transition', i <= step ? 'bg-p' : 'bg-line')} />)}</div>
      <p className="mb-5 text-[11.5px] font-semibold text-mut">Step {step} of 3</p>
      {step === 1 && (<>
        <h2 className="font-display text-[22px] font-extrabold">Reset password</h2>
        <p className="mt-1 text-[13px] text-mut">Registered email daalein. Hum 6-digit OTP bhejenge.</p>
        <Input className="mt-5" label="Email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@aksharmamedicos.in" />
        <Button className="mt-5 w-full" size="lg" loading={busy} disabled={!email} onClick={send}>Send OTP</Button>
      </>)}
      {step === 2 && (<>
        <h2 className="font-display text-[22px] font-extrabold">Enter OTP</h2>
        <p className="mt-1 text-[13px] text-mut">{email} par bheja gaya</p>
        <div className="mt-5 flex justify-between gap-2">
          {otp.map((d, i) => (
            <input key={i} id={`otp-${i}`} value={d} inputMode="numeric" maxLength={1}
              onChange={(e) => { const v = e.target.value.replace(/\D/, ''); const n = [...otp]; n[i] = v; setOtp(n); if (v && i < 5) document.getElementById(`otp-${i + 1}`).focus(); }}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`).focus(); }}
              onPaste={(e) => { const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (p.length === 6) { setOtp(p.split('')); e.preventDefault(); } }}
              className="h-12 w-12 rounded-xl border border-line text-center text-[20px] font-extrabold outline-none focus:border-p focus:ring-4 focus:ring-p/10" />
          ))}
        </div>
        <Button className="mt-5 w-full" size="lg" loading={busy} disabled={otp.join('').length !== 6} onClick={verify}>Verify</Button>
        <button disabled={timer > 0} onClick={send} className="mt-3 w-full text-center text-[12.5px] font-semibold text-p disabled:text-mut">{timer > 0 ? `Resend in 00:${String(timer).padStart(2, '0')}` : 'Resend OTP'}</button>
      </>)}
      {step === 3 && (<>
        <h2 className="font-display text-[22px] font-extrabold">New password</h2>
        <p className="mt-1 text-[13px] text-mut">Kam se kam 8 characters, capital + small letter, 1 number aur 1 symbol.</p>
        <Input className="mt-5" label="New password" type="password" icon={Lock} value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="mt-2 flex gap-1">{[0, 1, 2, 3].map((i) => <div key={i} className={cx('h-1 flex-1 rounded', i < s ? ['bg-bad', 'bg-warn', 'bg-blue', 'bg-ok'][s - 1] : 'bg-line')} />)}</div>
        <p className="mt-1 text-[11.5px] font-semibold text-mut">{['', 'Weak', 'Fair', 'Good', 'Strong password'][s]}</p>
        <Input className="mt-3" label="Confirm password" type="password" icon={Lock} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <Button className="mt-5 w-full" size="lg" loading={busy} disabled={s < 4} onClick={reset}>Update password</Button>
      </>)}
    </motion.div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [as, setAs] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try { const a = await login(email.trim(), password, as); toast.success(`Welcome, ${a.name.split(' ')[0]}!`); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.15fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[radial-gradient(110%_90%_at_20%_15%,#1C9C8E,#0F5F57_45%,#062824)] p-12 text-white lg:block">
        {[560, 400, 260].map((s, i) => <motion.div key={s} animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 6 + i, repeat: Infinity }} className="absolute rounded-full border border-white/10" style={{ width: s, height: s, right: -s / 4, bottom: -s / 4 }} />)}
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-p"><Plus size={24} strokeWidth={3.2} /></div>
          <div><div className="text-[16px] font-bold">AK Sharma Medicos</div><div className="text-[11px] tracking-[.18em] text-[#9FE3D7]">ADMIN CONSOLE</div></div>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-28 font-display text-[44px] font-extrabold leading-[1.05] tracking-tight">Manage your<br />pharmacy, beautifully.</motion.h1>
        <p className="mt-4 max-w-sm text-[15px] text-[#C8E6E1]">Orders, stock, prescriptions aur staff — sab ek jagah.</p>
        <div className="mt-10 flex gap-3">
          {[['Secure', 'Role-based access'], ['Live', 'Order updates'], ['Rx', 'Pharmacist verify']].map(([a, b], i) => (
            <motion.div key={a} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="rounded-2xl border border-white/15 bg-white/[.08] px-4 py-3 backdrop-blur">
              <div className="font-display text-[18px] font-extrabold">{a}</div><div className="text-[11.5px] text-[#9FE3D7]">{b}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-[380px]">
          <AnimatePresence mode="wait">
            {forgot ? <Forgot onBack={() => setForgot(false)} defaultEmail={email} /> : (
              <motion.form key="login" onSubmit={submit} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="font-display text-[26px] font-extrabold tracking-tight">Welcome back</h2>
                <p className="mt-1 text-[13.5px] text-mut">Apne account me login karein</p>
                <Tabs className="mt-6 w-full [&>button]:flex-1" value={as} onChange={setAs}
                  tabs={[{ value: 'admin', label: <><ShieldCheck size={14} />Admin</> }, { value: 'staff', label: <><Users size={14} />Staff</> }]} />
                <Input className="mt-5" label="Email" icon={Mail} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={as === 'admin' ? 'owner@aksharmamedicos.in' : 'staff@aksharmamedicos.in'} />
                <Input className="mt-3.5" label="Password" icon={Lock} type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  right={<button type="button" onClick={() => setShow(!show)} className="p-1 text-mut">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
                <div className="mt-3 flex items-center justify-between">
                  <Checkbox checked label="Remember me" onChange={() => {}} />
                  <button type="button" onClick={() => setForgot(true)} className="text-[13px] font-semibold text-p hover:underline">Forgot password?</button>
                </div>
                <AnimatePresence>{error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] font-medium text-bad">{error}</motion.p>}</AnimatePresence>
                <Button type="submit" className="mt-5 w-full" size="lg" loading={busy}>Login <ArrowRight size={15} /></Button>
                <div className="mt-6 flex gap-2.5 rounded-xl bg-bg p-3 text-[12px] leading-relaxed text-mut">
                  <KeyRound size={15} className="mt-0.5 shrink-0" />
                  {as === 'staff' ? 'Staff login sirf un logon ke liye hai jinke credentials admin ne banaye hain. Access admin ki di hui permissions ke hisaab se milega.' : 'Admin ke paas poora access hota hai. Staff accounts "Staff & Roles" se banayein.'}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
