import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, Copy, Eye, FileText, MapPin, Phone, Printer, RotateCcw, Send, Truck, X } from 'lucide-react';
import { api, errMsg, fetchBlobUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAction, useFetch } from '../utils/useFetch';
import { DELIVERY, dt, inr } from '../utils/format';
import { Avatar, Badge, Button, Card, Checkbox, Confirm, IconBtn, Input, Modal, PageHeader, Select, Shimmer, StatusBadge, Textarea, cx } from '../components/ui';
import { openInvoice } from './Orders';

const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

function RxViewer({ rx, onClose }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!rx) return undefined;
    let url;
    fetchBlobUrl(`/prescriptions/${rx.id}/file`).then((r) => { url = r.url; setSrc(r); }).catch((e) => toast.error(errMsg(e)));
    return () => url && URL.revokeObjectURL(url);
  }, [rx]);
  return (
    <Modal open={!!rx} onClose={() => { setSrc(null); onClose(); }} title="Prescription" width={720}>
      {!src ? <Shimmer className="h-96" /> : src.type === 'application/pdf' ? <iframe title="rx" src={src.url} className="h-[70vh] w-full rounded-lg" /> : <img src={src.url} alt="Prescription" className="mx-auto max-h-[70vh] rounded-lg" />}
    </Modal>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, admin } = useAuth();
  const { data: o, loading, reload, setData } = useFetch(`/orders/${id}`);
  const { data: staff } = useFetch(can('staff') ? '/staff' : null);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [rxView, setRxView] = useState(null);
  const [reject, setReject] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [cancel, setCancel] = useState(false);
  const [refund, setRefund] = useState(null);
  const { busy, run } = useAction();

  useEffect(() => { if (o) setNext(o.next_statuses?.find((s) => s !== 'cancelled') || ''); }, [o]);

  if (loading) return <div className="space-y-4"><Shimmer className="h-10 w-72" /><div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]"><Shimmer className="h-96" /><Shimmer className="h-96" /></div></div>;
  if (!o) return null;

  const updateStatus = async (status, n = note) => {
    const r = await run(() => api.patch(`/orders/${o.id}/status`, { status, note: n || undefined, notify }));
    if (r) { setData(r); setNote(''); }
  };
  const rxAction = async (action, n) => {
    const r = await run(() => api.post(`/orders/${o.id}/prescription`, { action, note: n }));
    if (r) { setData(r); setReject(false); }
  };
  const paid = o.payments.filter((p) => p.type === 'payment' && p.status === 'success').reduce((a, p) => a + Number(p.amount), 0);
  const refunded = o.payments.filter((p) => p.type === 'refund').reduce((a, p) => a + Number(p.amount), 0);
  const pay = o.payments.find((p) => p.type === 'payment' && p.status === 'success');
  const a = o.address || {};

  return (
    <>
      <PageHeader back={<IconBtn icon={ArrowLeft} onClick={() => navigate('/orders')} />}
        title={<span className="flex items-center gap-3">#{o.order_no}<StatusBadge status={o.status} label={o.status_label} /></span>}
        subtitle={`Placed ${dt(o.placed_at || o.created_at)} · ${DELIVERY[o.delivery_method]}`}
        actions={<>
          {o.invoice_available && <Button variant="outline" icon={Printer} onClick={() => openInvoice(o.id)}>Invoice PDF</Button>}
          {can('orders', 'edit') && o.next_statuses.includes('cancelled') && <Button variant="danger" icon={X} onClick={() => setCancel(true)}>Cancel order</Button>}
        </>} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <Card noPad title={`Items (${o.items.length})`} actions={<span className="text-[12px] text-mut">{DELIVERY[o.delivery_method]}</span>}>
            <table className="w-full">
              <thead><tr><th className="th">Product</th><th className="th">Price</th><th className="th">Qty</th><th className="th text-right">Total</th></tr></thead>
              <tbody>
                {o.items.map((it) => (
                  <tr key={it.product_id}>
                    <td className="td"><div className="flex items-center gap-3"><img src={it.image_url} className="h-10 w-10 rounded-lg bg-p-mint object-cover" alt="" />
                      <div><div className="font-semibold">{it.name} {it.rx_required && <Badge tone="bad" className="!px-1.5">Rx</Badge>}</div>
                        <div className="text-[11.5px] text-mut">{it.pack_size}{it.batches?.length ? ` · Batch ${it.batches.map((b) => b.batch_no).join(', ')}` : ''}</div></div></div></td>
                    <td className="td">{inr(it.price)} <s className="text-[11px] text-mut">{inr(it.mrp)}</s></td>
                    <td className="td">× {it.qty}</td>
                    <td className="td text-right font-bold">{inr(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1.5 px-4 py-3 text-[13px]">
              <div className="flex justify-between text-mut"><span>MRP total</span><span>{inr(o.mrp_total, 2)}</span></div>
              <div className="flex justify-between text-mut"><span>Product discount</span><span className="text-ok">− {inr(o.product_discount, 2)}</span></div>
              {o.coupon_discount > 0 && <div className="flex justify-between text-mut"><span>Coupon {o.coupon_code}</span><span className="text-ok">− {inr(o.coupon_discount, 2)}</span></div>}
              <div className="flex justify-between text-mut"><span>Delivery</span><span>{o.delivery_charge ? inr(o.delivery_charge) : 'FREE'}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-extrabold"><span>Total</span><span>{inr(o.total, 2)}</span></div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Prescription">
              {!o.rx_required ? <p className="text-[13px] text-mut">Is order me Rx medicine nahi hai.</p> : !o.prescription ? <p className="text-[13px] text-bad">Prescription missing</p> : (
                <div className="flex gap-3">
                  <button onClick={() => setRxView(o.prescription)} className="grid h-20 w-16 shrink-0 place-items-center rounded-lg border border-line bg-[#FAFCFB] text-mut hover:border-p"><FileText size={22} /></button>
                  <div className="text-[12.5px]">
                    <Badge tone={o.rx_status === 'approved' ? 'ok' : o.rx_status === 'rejected' ? 'bad' : 'warn'}>{o.rx_status === 'pending' ? 'Review pending' : o.rx_status}</Badge>
                    <div className="mt-1.5 text-mut">{o.prescription.file_name}</div>
                    {o.prescription.note && <div className="mt-1 text-mut">Note: {o.prescription.note}</div>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" icon={Eye} onClick={() => setRxView(o.prescription)}>View</Button>
                      {can('prescriptions', 'edit') && o.rx_status === 'pending' && (<>
                        <Button size="sm" icon={Check} loading={busy} onClick={() => rxAction('approve')}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => setReject(true)}>Reject</Button>
                      </>)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
            <Card title="Customer">
              <Link to={`/customers/${o.customer.id}`} className="flex items-center gap-2.5"><Avatar name={o.customer.name} size={36} /><div><div className="font-semibold">{o.customer.name}</div><div className="text-[12px] text-mut">{o.customer.email}</div></div></Link>
              <div className="mt-3 space-y-1.5 text-[12.5px] text-ink-2">
                <div className="flex gap-2"><Phone size={14} className="mt-0.5 text-mut" />{a.country_code || '+91'} {a.phone || o.customer.phone}</div>
                {!a.pickup && <div className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-mut" />{a.full_address}</div>}
                {a.pickup && <div className="flex gap-2"><MapPin size={14} className="mt-0.5 text-mut" />Store pickup</div>}
              </div>
              <Link to={`/customers/${o.customer.id}`} className="mt-2 block text-[12.5px] font-semibold text-p">{o.customer.orders_count} orders · {inr(o.customer.total_spent)} spent →</Link>
            </Card>
          </div>
          {o.customer_note && <Card title="Customer note"><p className="text-[13px]">{o.customer_note}</p></Card>}
        </div>

        <div className="space-y-4">
          {can('order_status', 'edit') && o.next_statuses.filter((s) => s !== 'cancelled').length > 0 && (
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="card border-[1.5px] border-p p-4 shadow-[0_16px_30px_-20px_rgba(15,95,87,.6)]">
              <h3 className="text-[13.5px] font-bold">Update status</h3>
              <div className="mt-3 flex gap-1">
                {FLOW.map((s) => {
                  const done = FLOW.indexOf(s) <= FLOW.indexOf(o.status);
                  const allowed = o.next_statuses.includes(s);
                  return (
                    <button key={s} disabled={!allowed} onClick={() => setNext(s)}
                      className={cx('flex-1 rounded-lg py-2 text-[11.5px] font-semibold capitalize transition', next === s ? 'bg-p text-white shadow-btn' : done ? 'bg-p-mint text-p' : allowed ? 'border border-p text-p' : 'border border-line text-[#9AAAA7]')}>
                      {o.delivery_method === 'pickup' && s === 'shipped' ? 'Ready' : s}
                    </button>
                  );
                })}
              </div>
              {o.rx_required && o.rx_status !== 'approved' && o.status === 'placed' && <p className="mt-2 text-[12px] text-warn">Confirm karne se pehle prescription approve karein.</p>}
              <div className="mt-3"><Checkbox checked={notify} onChange={setNotify} label="Customer ko push notification bhejein (Firebase)" /></div>
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="Note (optional)…" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button loading={busy} disabled={!next} onClick={() => updateStatus(next)}>Mark {o.delivery_method === 'pickup' && next === 'shipped' ? 'Ready' : next}</Button>
              </div>
            </motion.div>
          )}

          {o.delivery_method !== 'pickup' && (
            <Card title="Delivery" actions={<Badge tone="p" icon={Truck}>{o.delivery_method === 'home' ? 'Own delivery' : 'Courier'}</Badge>}>
              {o.delivery_method === 'home' ? (
                <div className="flex items-end gap-2">
                  <Select className="flex-1" label="Delivery boy" value={o.delivery_agent?.id || ''} placeholder="Assign karein…" disabled={!can('orders', 'edit') || !staff}
                    options={(staff || []).filter((s) => s.is_active).map((s) => ({ value: s.id, label: `${s.name} · ${s.role}` }))}
                    onChange={async (e) => { if (await run(() => api.patch(`/orders/${o.id}/assign`, { agent_id: e.target.value ? Number(e.target.value) : null }))) reload(true); }} />
                </div>
              ) : (
                <div className="space-y-2 text-[13px]">
                  {o.courier_awb ? (<><div>AWB: <b>{o.courier_awb}</b> · {o.courier_name}</div>{o.tracking_url && <a className="font-semibold text-p" href={o.tracking_url} target="_blank" rel="noreferrer">Track shipment →</a>}</>)
                    : can('orders', 'edit') && <Button size="sm" icon={Send} loading={busy} onClick={async () => { if (await run(() => api.post(`/orders/${o.id}/shiprocket`))) reload(true); }}>Create Shiprocket shipment</Button>}
                  {!o.shiprocket_enabled && !o.courier_awb && <p className="text-[11.5px] text-mut">Shiprocket .env me configure karein, ya AWB manually daalein.</p>}
                </div>
              )}
            </Card>
          )}

          <Card title="Timeline">
            {o.timeline.map((t, i) => (
              <div key={t.status} className="relative flex gap-3 pb-4 last:pb-0">
                {i < o.timeline.length - 1 && <div className={cx('absolute left-[9px] top-5 h-full w-0.5', t.done ? 'bg-ok' : 'bg-line')} />}
                <div className={cx('relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full', t.done ? 'bg-ok text-white' : t.current ? 'border-2 border-p bg-white' : 'border-2 border-[#CBD5D3] bg-white')}>
                  {t.done && <Check size={11} strokeWidth={3.5} />}
                </div>
                <div className="flex-1"><div className={cx('text-[13px] font-semibold', !t.done && 'text-[#9AAAA7]')}>{t.label}</div>
                  <div className="text-[11.5px] text-mut">{o.history.filter((h) => h.status === t.status).map((h) => `${h.changed_by_name || h.changed_by_type}${h.note ? ' · ' + h.note : ''}`).join(', ')}</div></div>
                <span className="text-[11.5px] text-mut">{t.at ? dt(t.at, { year: false }) : ''}</span>
              </div>
            ))}
            {o.status === 'cancelled' && <div className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] text-bad">Cancelled: {o.cancel_reason}</div>}
          </Card>

          <Card title="Payment · Razorpay" actions={<Badge tone={o.payment_status === 'paid' ? 'ok' : o.payment_status.includes('refund') ? 'blue' : 'bad'}>{o.payment_status.replace('_', ' ')}</Badge>}>
            {pay ? (
              <>
                <div className="text-[12.5px] text-mut">{pay.razorpay_payment_id?.split(':')[0]} · <span className="uppercase">{pay.method}</span> {pay.method_detail} · {dt(pay.created_at)}</div>
                <div className="mt-2 text-[13px]">Paid <b>{inr(paid, 2)}</b>{refunded > 0 && <> · Refunded <b className="text-blue">{inr(refunded, 2)}</b></>}</div>
                <div className="mt-3 flex gap-2">
                  {can('refunds', 'create') && paid - refunded > 0 && <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => setRefund({ amount: (paid - refunded).toFixed(2), reason: '' })}>Refund</Button>}
                  <Button size="sm" variant="outline" icon={Copy} onClick={() => { navigator.clipboard.writeText(pay.razorpay_payment_id.split(':')[0]); toast.success('Copied'); }}>Copy ID</Button>
                </div>
              </>
            ) : <p className="text-[13px] text-mut">Successful payment nahi hua.</p>}
            {o.payments.filter((p) => p.type === 'refund').map((r) => (
              <div key={r.id} className="mt-2 rounded-lg bg-blue-soft px-3 py-2 text-[12px] text-blue">Refund {inr(r.amount, 2)} · {r.razorpay_refund_id} · {r.status}</div>
            ))}
          </Card>
        </div>
      </div>

      <RxViewer rx={rxView} onClose={() => setRxView(null)} />
      <Modal open={reject} onClose={() => setReject(false)} title="Prescription reject" width={440}
        footer={<><Button variant="outline" onClick={() => setReject(false)}>Cancel</Button><Button variant="solidDanger" loading={busy} disabled={rejectNote.length < 3} onClick={() => rxAction('reject', rejectNote)}>Reject + refund</Button></>}>
        <Textarea label="Reason (customer ko dikhega)" placeholder="Prescription clear nahi hai / doctor ka sign nahi hai…" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
        <p className="mt-2 text-[12px] text-mut">Reject karne par order cancel hoga aur pura refund automatically jayega.</p>
      </Modal>
      <Confirm open={cancel} danger title="Order cancel karein?" confirmText="Cancel order" loading={busy} onClose={() => setCancel(false)}
        message={<>Order <b>{o.order_no}</b> cancel hoga, stock wapas jayega{o.payment_status === 'paid' ? ` aur ${inr(paid - refunded, 2)} refund automatically jayega` : ''}.</>}
        onConfirm={async () => { await updateStatus('cancelled', note || `Cancelled by ${admin.name}`); setCancel(false); }} />
      <Modal open={!!refund} onClose={() => setRefund(null)} title="Issue refund" width={420}
        footer={<><Button variant="outline" onClick={() => setRefund(null)}>Cancel</Button><Button loading={busy} onClick={async () => { if (await run(() => api.post(`/orders/${o.id}/refund`, { amount: Number(refund.amount), reason: refund.reason }))) { setRefund(null); reload(true); } }}>Process refund</Button></>}>
        {refund && <div className="space-y-3">
          <Input label="Amount (₹)" type="number" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} hint={`Max ${inr(paid - refunded, 2)}`} />
          <Input label="Reason" value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} />
        </div>}
      </Modal>
    </>
  );
}
