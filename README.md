# AK Sharma Medicos — Admin Panel (React)

Vite + React 18 + Tailwind + Framer Motion + Recharts. Premium UI, shimmer loading, page/row animations.

## Run

```bash
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:4000/api/v1
npm run dev                   # http://localhost:5173
npm run build                 # dist/ -> kisi bhi static hosting (Nginx, Netlify, S3+CloudFront) par
```

Backend `.env` me `CORS_ORIGINS` me admin panel ka URL hona chahiye (e.g. `https://admin.aksharmamedicos.in`).

Default login (seed): **Admin tab** → `owner@aksharmamedicos.in` / `Admin@12345`

## Security

- Access token sirf **memory** me (localStorage/sessionStorage me nahi) → XSS se chori nahi hota
- Refresh token **httpOnly cookie** me (backend set karta hai), har refresh par rotate
- `TOKEN_EXPIRED` par ek hi refresh call (queue), phir request retry; refresh fail → login
- Har 13 min silent refresh; reload par cookie se session wapas
- UI permission se menu/buttons chhupata hai, **par asli check backend karta hai** (403)
- Prescription / invoice files auth header ke saath blob me load hote hain (public URL nahi)

## Pages

| Page | Kya hai |
|---|---|
| Login | Admin / Staff tabs, forgot password (email → OTP → new password) |
| Dashboard | Aaj ke orders/revenue, Rx pending, stock alerts, sales chart, order status donut |
| Categories | CRUD, image/banner upload, gradient, drag-to-reorder, hide/show |
| Products | Search/filter, bulk actions, stock bar, spotlight toggle |
| Add/Edit product | Pricing (auto discount), multiple images (drag reorder), Rx flag, batch + expiry |
| Inventory | Batch-wise stock, expiry badges, stock add/remove with reason, movement history |
| Orders | Status tabs with counts, filters, CSV export, 30 sec auto-refresh |
| Order detail | Status update (+ push), Rx approve/reject, delivery assign, Shiprocket, refund, invoice |
| Customers | KPIs, list, CSV export |
| Customer profile | Order history + **transaction history** + addresses, block/unblock |
| Transactions | Payments/refunds/failed, method split |
| Staff & roles | Staff list, role presets, activity log, reset password |
| Add/Edit staff | Permission matrix (View/Create/Edit/Delete) + live sidebar preview |
| Spotlight & banners | Home banners (drag order), category-wise spotlight offers, coupons |
| Notifications | Push campaign (audience: all / customer / pincode / category buyers) + live preview |
| Settings | Delivery (own / pickup / Shiprocket + pincodes), store & license, app versions |
