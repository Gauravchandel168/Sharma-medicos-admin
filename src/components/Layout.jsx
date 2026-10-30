import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BarChart3, Layers, Pill, Boxes, Package, Users, Receipt, Zap, Send, ShieldCheck, Settings, LogOut, Bell, Search, Menu, KeyRound, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { Avatar, cx } from './ui';

export const NAV = [
  { group: 'Main', items: [{ to: '/', label: 'Dashboard', icon: BarChart3, perm: 'dashboard' }] },
  { group: 'Catalog', items: [
    { to: '/categories', label: 'Categories', icon: Layers, perm: 'categories' },
    { to: '/products', label: 'Products', icon: Pill, perm: 'products' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, perm: 'inventory', badge: 'stock' },
  ] },
  { group: 'Sales', items: [
    { to: '/orders', label: 'Orders', icon: Package, perm: 'orders', badge: 'orders' },
    { to: '/customers', label: 'Customers', icon: Users, perm: 'customers' },
    { to: '/transactions', label: 'Transactions', icon: Receipt, perm: 'transactions' },
  ] },
  { group: 'Marketing', items: [
    { to: '/marketing', label: 'Spotlight & Banners', icon: Zap, perm: 'banners' },
    { to: '/notifications', label: 'Notifications', icon: Send, perm: 'notifications' },
  ] },
  { group: 'Admin', items: [
    { to: '/staff', label: 'Staff & Roles', icon: ShieldCheck, perm: 'staff' },
    { to: '/settings', label: 'Settings', icon: Settings, perm: 'settings' },
  ] },
];

export const firstAllowedPath = (can) => NAV.flatMap((g) => g.items).find((i) => can(i.perm))?.to || '/account';

function Sidebar({ open, onClose, badges }) {
  const { admin, can, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <div className={cx('fixed inset-0 z-30 bg-black/40 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
      <aside className={cx('side-scroll fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col overflow-y-auto bg-gradient-to-b from-p-side to-p-side2 px-3 py-4 text-[#BFD6D2] transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center gap-2.5 px-2 pb-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#46C9B5] to-[#13786D] text-white shadow-lg"><Plus size={20} strokeWidth={3.2} /></div>
          <div className="leading-tight"><div className="text-[14px] font-bold text-white">AK Sharma Medicos</div><div className="text-[11px] text-[#8FB4AE]">Admin Console</div></div>
        </div>
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group} className="mb-2">
              <div className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#6F9590]">{g.group}</div>
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.to === '/'} onClick={onClose}
                  className={({ isActive }) => cx('relative mb-0.5 flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] transition', isActive ? 'bg-white/10 font-semibold text-white' : 'hover:bg-white/5 hover:text-white')}>
                  {({ isActive }) => (<>
                    {isActive && <motion.span layoutId="nav-ind" className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-[#46C9B5]" />}
                    <i.icon size={17} strokeWidth={2} />{i.label}
                    {i.badge && badges[i.badge] > 0 && <span className="ml-auto rounded-full bg-acc px-1.5 text-[10px] font-bold text-white">{badges[i.badge]}</span>}
                  </>)}
                </NavLink>
              ))}
            </div>
          );
        })}
        <div className="mt-auto rounded-xl bg-white/[.07] p-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={admin?.name} size={34} />
            <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[13px] font-semibold text-white">{admin?.name}</div><div className="text-[11px] text-[#8FB4AE]">{admin?.role}</div></div>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button onClick={() => navigate('/account')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-[11.5px] hover:bg-white/10"><KeyRound size={13} />Password</button>
            <button onClick={logout} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 text-[11.5px] hover:bg-white/10"><LogOut size={13} />Logout</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Layout() {
  const { admin, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState({});
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const b = {};
      try { if (can('orders')) b.orders = (await api.get('/orders', { params: { status: 'placed', per_page: 1 } })).data.meta.counts.placed || 0; } catch { /* */ }
      try { if (can('inventory')) { const s = (await api.get('/inventory/summary')).data.data; b.stock = s.out_of_stock + s.low_stock; } } catch { /* */ }
      setBadges(b);
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [can]);

  useEffect(() => { if (admin?.must_change_password && loc.pathname !== '/account') navigate('/account'); }, [admin, loc.pathname, navigate]);

  return (
    <div className="min-h-full">
      <Sidebar open={open} onClose={() => setOpen(false)} badges={badges} />
      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="relative ml-auto hidden w-[300px] md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input placeholder="Order ID search karein…  (Enter)" className="input h-9 bg-bg pl-9"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) navigate(`/orders?search=${encodeURIComponent(e.target.value.trim())}`); }} />
          </div>
          <button onClick={() => can('orders') && navigate('/orders?status=placed')} className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-ink-2 md:ml-0 ml-auto">
            <Bell size={16} />
            {badges.orders > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-acc px-1 text-[9px] font-bold text-white">{badges.orders}</span>}
          </button>
          <Avatar name={admin?.name} size={34} />
        </header>
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="mx-auto max-w-[1400px] p-4 lg:p-6">
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
