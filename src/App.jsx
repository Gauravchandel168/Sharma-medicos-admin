import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout, { firstAllowedPath } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Transactions from './pages/Transactions';
import Staff from './pages/Staff';
import StaffForm from './pages/StaffForm';
import Marketing from './pages/Marketing';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Account from './pages/Account';
import { Empty } from './components/ui';
import { ShieldAlert } from 'lucide-react';

function Splash() {
  return (
    <div className="grid h-full place-items-center bg-gradient-to-br from-p-light via-p to-p-side2">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-white text-p shadow-2xl"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" /></svg></div>
        <div className="text-sm text-[#C8E6E1]">Loading…</div>
      </div>
    </div>
  );
}

const Guard = ({ perm, action = 'view', children }) => {
  const { can } = useAuth();
  return can(perm, action) ? children : <Empty icon={ShieldAlert} title="Access nahi hai" subtitle="Is page ki permission aapke paas nahi hai. Admin se contact karein." />;
};

export default function App() {
  const { admin, booting, can } = useAuth();
  if (booting) return <Splash />;
  if (!admin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  const home = firstAllowedPath(can);
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={can('dashboard') ? <Dashboard /> : <Navigate to={home} replace />} />
        <Route path="categories" element={<Guard perm="categories"><Categories /></Guard>} />
        <Route path="products" element={<Guard perm="products"><Products /></Guard>} />
        <Route path="products/new" element={<Guard perm="products" action="create"><ProductForm /></Guard>} />
        <Route path="products/:id" element={<Guard perm="products" action="edit"><ProductForm /></Guard>} />
        <Route path="inventory" element={<Guard perm="inventory"><Inventory /></Guard>} />
        <Route path="orders" element={<Guard perm="orders"><Orders /></Guard>} />
        <Route path="orders/:id" element={<Guard perm="orders"><OrderDetail /></Guard>} />
        <Route path="customers" element={<Guard perm="customers"><Customers /></Guard>} />
        <Route path="customers/:id" element={<Guard perm="customers"><CustomerDetail /></Guard>} />
        <Route path="transactions" element={<Guard perm="transactions"><Transactions /></Guard>} />
        <Route path="staff" element={<Guard perm="staff"><Staff /></Guard>} />
        <Route path="staff/new" element={<Guard perm="staff" action="create"><StaffForm /></Guard>} />
        <Route path="staff/:id" element={<Guard perm="staff" action="edit"><StaffForm /></Guard>} />
        <Route path="marketing" element={<Guard perm="banners"><Marketing /></Guard>} />
        <Route path="notifications" element={<Guard perm="notifications"><Notifications /></Guard>} />
        <Route path="settings" element={<Guard perm="settings"><Settings /></Guard>} />
        <Route path="account" element={<Account />} />
        <Route path="login" element={<Navigate to={home} replace />} />
        <Route path="*" element={<Empty title="Page nahi mila" />} />
      </Route>
    </Routes>
  );
}
