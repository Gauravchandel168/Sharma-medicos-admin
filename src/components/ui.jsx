import { forwardRef, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, UploadCloud, X, Inbox, AlertTriangle } from 'lucide-react';
import { ORDER_STATUS, avatarColor, initials } from '../utils/format';

export const cx = clsx;

// ---------------- Buttons ----------------
export const Button = forwardRef(function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, ...p }, ref) {
  const v = {
    primary: 'bg-gradient-to-br from-p-light to-p text-white shadow-btn hover:brightness-110',
    outline: 'bg-white text-ink-2 border border-line hover:bg-[#F6F9F8]',
    danger: 'bg-white text-bad border border-[#F5C4C5] hover:bg-bad-soft',
    solidDanger: 'bg-bad text-white hover:brightness-110',
    ghost: 'text-p hover:bg-p-mint',
    accent: 'bg-gradient-to-br from-[#FF8A4C] to-acc text-white shadow-[0_8px_16px_-8px_rgba(255,106,61,.65)]',
  }[variant];
  const s = { sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-[9px]', md: 'h-9 px-3.5 text-[13px] gap-2 rounded-[10px]', lg: 'h-11 px-5 text-[14px] gap-2 rounded-xl' }[size];
  return (
    <motion.button ref={ref} whileTap={{ scale: 0.97 }} disabled={loading || p.disabled}
      className={cx('inline-flex items-center justify-center font-semibold whitespace-nowrap transition disabled:opacity-55 disabled:cursor-not-allowed', v, s, className)} {...p}>
      {loading ? <Loader2 className="animate-spin" size={15} /> : Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </motion.button>
  );
});

export const IconBtn = ({ icon: Icon, title, danger, className, ...p }) => (
  <button title={title} className={cx('grid h-8 w-8 place-items-center rounded-lg border border-line bg-white transition hover:bg-[#F3F7F6]', danger ? 'text-bad hover:bg-bad-soft' : 'text-mut hover:text-ink', className)} {...p}>
    <Icon size={15} />
  </button>
);

// ---------------- Inputs ----------------
export const Field = ({ label, error, hint, children, className }) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    {children}
    {error ? <p className="mt-1 text-[11.5px] font-medium text-bad">{error}</p> : hint && <p className="mt-1 text-[11.5px] text-mut">{hint}</p>}
  </div>
);

export const Input = forwardRef(function Input({ label, error, hint, icon: Icon, className, right, ...p }, ref) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <div className="relative">
        {Icon && <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" />}
        <input ref={ref} className={cx('input', Icon && 'pl-9', right && 'pr-10', error && 'border-bad focus:border-bad focus:ring-bad/10')} {...p} />
        {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </Field>
  );
});

export const Textarea = ({ label, error, className, ...p }) => (
  <Field label={label} error={error} className={className}>
    <textarea className="input h-auto min-h-[80px] py-2.5 leading-relaxed" {...p} />
  </Field>
);

export const Select = ({ label, error, options, className, placeholder, ...p }) => (
  <Field label={label} error={error} className={className}>
    <div className="relative">
      <select className="input appearance-none pr-8" {...p}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mut" />
    </div>
  </Field>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className }) => {
  const [v, setV] = useState(value || '');
  const t = useRef();
  useEffect(() => setV(value || ''), [value]);
  return (
    <div className={cx('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
      <input className="input pl-9" value={v} placeholder={placeholder}
        onChange={(e) => { setV(e.target.value); clearTimeout(t.current); t.current = setTimeout(() => onChange(e.target.value), 350); }} />
    </div>
  );
};

export const Toggle = ({ checked, onChange, disabled }) => (
  <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
    className={cx('relative h-[20px] w-[36px] shrink-0 rounded-full transition-colors', checked ? 'bg-p' : 'bg-[#CBD5D3]', disabled && 'opacity-50')}>
    <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
      className={cx('absolute top-[2px] h-4 w-4 rounded-full bg-white shadow', checked ? 'right-[2px]' : 'left-[2px]')} />
  </button>
);

export const Checkbox = ({ checked, onChange, label, disabled }) => (
  <label className={cx('inline-flex cursor-pointer select-none items-center gap-2 text-[13px]', disabled && 'cursor-not-allowed opacity-50')}>
    <span onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!checked); }}
      className={cx('grid h-[17px] w-[17px] place-items-center rounded-[5px] border-[1.6px] transition', checked ? 'border-p bg-p' : 'border-[#B7C3C1] bg-white')}>
      {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><path d="M20 6 9 17l-5-5" /></svg>}
    </span>
    {label}
  </label>
);

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={cx('inline-flex rounded-[10px] bg-[#EEF2F1] p-[3px]', className)}>
    {tabs.map((t) => (
      <button key={t.value} onClick={() => onChange(t.value)}
        className={cx('relative rounded-[8px] px-3 py-1.5 text-[12.5px] font-semibold transition', value === t.value ? 'text-ink' : 'text-mut hover:text-ink-2')}>
        {value === t.value && <motion.span layoutId={`tab-${tabs.map((x) => x.value).join()}`} className="absolute inset-0 rounded-[8px] bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
        <span className="relative flex items-center gap-1.5">{t.label}{t.count !== undefined && <span className="rounded-full bg-[#E4EAE8] px-1.5 text-[10.5px]">{t.count}</span>}</span>
      </button>
    ))}
  </div>
);

// ---------------- Badges ----------------
const TONE = {
  ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', blue: 'bg-blue-soft text-blue',
  vio: 'bg-vio-soft text-vio', p: 'bg-p-mint text-p', mut: 'bg-[#EEF2F1] text-mut', acc: 'bg-acc-soft text-acc',
};
export const Badge = ({ tone = 'mut', icon: Icon, children, className }) => (
  <span className={cx('chip', TONE[tone], className)}>{Icon && <Icon size={11} strokeWidth={2.6} />}{children}</span>
);
export const StatusBadge = ({ status, label }) => {
  const [l, t] = ORDER_STATUS[status] || [status, 'mut'];
  return <Badge tone={t}>{label || l}</Badge>;
};

export const Avatar = ({ name, size = 30, className }) => (
  <div className={cx('grid shrink-0 place-items-center rounded-full font-bold text-white', className)}
    style={{ width: size, height: size, fontSize: size * 0.36, background: avatarColor(name) }}>{initials(name)}</div>
);

// ---------------- Layout pieces ----------------
export const PageHeader = ({ title, subtitle, actions, back }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div className="flex items-center gap-3">
      {back}
      <div>
        <h1 className="font-display text-[22px] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-mut">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card = ({ title, actions, children, className, bodyClass, noPad }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cx('card overflow-hidden', className)}>
    {title && (
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h3 className="text-[13.5px] font-bold">{title}</h3>
        {actions}
      </div>
    )}
    <div className={cx(!noPad && 'p-4', bodyClass)}>{children}</div>
  </motion.div>
);

export const Kpi = ({ icon: Icon, label, value, sub, tone = 'p', down, loading }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-4">
    <div className="flex items-center gap-2 text-[12px] font-semibold text-mut">
      <span className={cx('grid h-7 w-7 place-items-center rounded-lg', TONE[tone])}><Icon size={15} /></span>{label}
    </div>
    {loading ? <div className="shimmer mt-3 h-7 w-28" /> : <div className="mt-2 font-display text-[24px] font-extrabold tracking-tight">{value}</div>}
    {sub && !loading && <div className={cx('mt-0.5 text-[11.5px] font-semibold', down ? 'text-bad' : 'text-ok')}>{sub}</div>}
    <div className={cx('pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40', TONE[tone])} />
  </motion.div>
);

export const Shimmer = ({ className, style }) => <div className={cx('shimmer', className)} style={style} />;

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>{Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="td"><Shimmer className="h-4" style={{ width: `${j === 0 ? 70 : 40 + ((i * 7 + j * 13) % 45)}%` }} /></td>
      ))}</tr>
    ))}
  </tbody>
);

export const Empty = ({ icon: Icon = Inbox, title = 'Kuch nahi mila', subtitle, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-p-mint text-p"><Icon size={24} /></div>
    <p className="font-bold">{title}</p>
    {subtitle && <p className="mt-1 max-w-sm text-[13px] text-mut">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.total_pages <= 1) return meta ? <div className="px-4 py-3 text-[12px] text-mut">{meta.total} results</div> : null;
  const { page, total_pages: tp, total, per_page: pp } = meta;
  const nums = [...new Set([1, page - 1, page, page + 1, tp])].filter((n) => n >= 1 && n <= tp).sort((a, b) => a - b);
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[12px] text-mut">
      <span>Showing {(page - 1) * pp + 1}–{Math.min(page * pp, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <IconBtn icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {nums.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1">…</span>}
            <button onClick={() => onPage(n)} className={cx('h-8 min-w-8 rounded-lg px-2 font-semibold', n === page ? 'bg-p text-white' : 'border border-line bg-white hover:bg-[#F3F7F6]')}>{n}</button>
          </span>
        ))}
        <IconBtn icon={ChevronRight} disabled={page >= tp} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
};

// ---------------- Overlays ----------------
export const Modal = ({ open, onClose, title, children, footer, width = 520 }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-[#081E1B]/45 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative max-h-[90vh] w-full overflow-auto rounded-2xl bg-white shadow-pop" style={{ maxWidth: width }}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-3.5">
            <h3 className="font-display text-[16px] font-extrabold">{title}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Drawer = ({ open, onClose, title, children, footer, width = 440 }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-[#081E1B]/40" onClick={onClose} />
        <motion.div initial={{ x: width }} animate={{ x: 0 }} exit={{ x: width }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="absolute right-0 top-0 flex h-full flex-col bg-white shadow-pop" style={{ width, maxWidth: '100vw' }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="font-display text-[16px] font-extrabold">{title}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
          <div className="flex-1 overflow-auto p-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Confirm = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger, loading, children }) => (
  <Modal open={open} onClose={onClose} title={title} width={430}
    footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={danger ? 'solidDanger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmText}</Button></>}>
    <div className="flex gap-3">
      {danger && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bad-soft text-bad"><AlertTriangle size={18} /></div>}
      <div className="text-[13.5px] leading-relaxed text-ink-2">{message}{children}</div>
    </div>
  </Modal>
);

// ---------------- Image uploader ----------------
export const ImageDrop = ({ onFiles, multiple, label = 'Drag & drop ya browse', hint = 'PNG / JPG / WEBP · max 5 MB', busy, className }) => {
  const [over, setOver] = useState(false);
  const ref = useRef();
  return (
    <div onClick={() => ref.current.click()} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      className={cx('flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed px-4 py-5 text-center text-[12.5px] transition', over ? 'border-p bg-p-mint' : 'border-[#B7C3C1] bg-[#FAFCFB] hover:border-p-light', className)}>
      {busy ? <Loader2 className="animate-spin text-p" size={20} /> : <UploadCloud size={20} className="text-mut" />}
      <span className="font-semibold text-ink-2">{label}</span>
      <span className="text-[11px] text-mut">{hint}</span>
      <input ref={ref} type="file" hidden multiple={multiple} accept="image/png,image/jpeg,image/webp" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
};

export const Stagger = ({ children, className, as = 'tbody' }) => {
  const M = motion[as];
  return <M className={className} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>{children}</M>;
};
export const rowAnim = { variants: { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } } };
