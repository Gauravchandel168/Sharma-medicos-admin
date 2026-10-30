export const inr = (n, d = 0) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: 2 });

export const dt = (v, opts = {}) => {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: opts.year === false ? undefined : 'numeric', hour: opts.time === false ? undefined : '2-digit', minute: opts.time === false ? undefined : '2-digit' });
};
export const dateOnly = (v) => dt(v, { time: false });
export const timeAgo = (v) => {
  if (!v) return '—';
  const s = (Date.now() - new Date(v).getTime()) / 1000;
  if (s < 60) return 'abhi';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 172800) return 'Yesterday';
  return dateOnly(v);
};
export const initials = (n = '') => n.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?';
const AV = ['#E2553A', '#7C4DDB', '#2F6FEB', '#C9306E', '#129A4E', '#D98A06', '#17877B'];
export const avatarColor = (seed = '') => AV[[...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
export const ORDER_STATUS = {
  pending_payment: ['Payment pending', 'mut'], placed: ['Placed', 'blue'], confirmed: ['Confirmed', 'vio'], packed: ['Packed', 'warn'],
  shipped: ['Shipped', 'p'], delivered: ['Delivered', 'ok'], cancelled: ['Cancelled', 'bad'], payment_failed: ['Payment failed', 'bad'],
};
export const DELIVERY = { home: 'Home delivery', pickup: 'Store pickup', courier: 'Courier' };
