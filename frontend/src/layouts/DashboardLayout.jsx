import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Receipt,
  Users,
  CreditCard,
  DollarSign,
  TrendingDown,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCashStatus = async () => {
      try {
        const res = await api.get('/cash/current');
        if (res.data.success) {
          setActiveSession(res.data.data);
        }
      } catch (err) {
        // silent
      }
    };
    fetchCashStatus();
  }, [location.pathname]);

  const navItems = [
    { name: 'Bogga Guud (Dashboard)', path: '/', icon: LayoutDashboard },
    { name: 'Iibka Tooska ah (POS)', path: '/pos', icon: ShoppingCart },
    { name: 'Alaabta & Qiimaha (Products)', path: '/products', icon: Package },
    { name: 'Qeybaha Alaabta (Categories)', path: '/categories', icon: Layers },
    { name: 'Dhaqdhaqaaqa Bakhaarka', path: '/inventory', icon: FileSpreadsheet },
    { name: 'Alaab Soo Iibsashada (Purchases)', path: '/purchases', icon: Truck },
    { name: 'Taariikhda Iibka (Sales)', path: '/sales', icon: Receipt },
    { name: 'Macaamiisha (Customers)', path: '/customers', icon: Users },
    { name: 'Daymaha Macaamiisha (Debts)', path: '/debts', icon: CreditCard },
    { name: 'Lacag Qabashada (Payments)', path: '/payments', icon: DollarSign },
    { name: 'Ganacsatada Alaabta (Suppliers)', path: '/suppliers', icon: Truck },
    { name: 'Khasnadda Lacagta (Cash)', path: '/cash', icon: Wallet },
    { name: 'Kharashaadka Dukaanka (Expenses)', path: '/expenses', icon: TrendingDown },
    { name: 'Warbixinnada Xisaabta (Reports)', path: '/reports', icon: BarChart3 },
    ...(hasRole('ADMIN')
      ? [
          { name: 'Shaqaalaha & Akoonnada (Users)', path: '/users', icon: ShieldCheck },
          { name: 'Diiwaanka Ficillada (Audit Logs)', path: '/audit-logs', icon: ShieldCheck },
          { name: 'Habaynta Nidaamka (Settings)', path: '/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/30">
              D
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base">DUKAAN</span>
              <span className="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Shop ERP</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Cash Drawer Status in Sidebar */}
        <div className="p-3 mx-3 my-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Wallet size={13} className="text-indigo-400" /> Khasnadda Lacagta
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeSession ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {activeSession ? 'FURAN' : 'XIDHAN'}
            </span>
          </div>
          <button
            onClick={() => navigate('/cash')}
            className="w-full text-left text-[11px] text-indigo-400 hover:text-indigo-300 font-medium pt-1"
          >
            {activeSession ? 'Maamul Khasnadda →' : 'Fur Khasnad Maalinle ah →'}
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Isticmaale'}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase font-medium">
                {user?.role === 'ADMIN' ? 'Maamule (Admin)' : user?.role === 'CASHIER' ? 'Khasnaji (Cashier)' : 'Maamulaha Bakhaarka'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Ka bax nidaamka (Log out)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-800">DUKAAN Enterprise — Maamulka Dukaanka & Xisaabaadka</h1>
              <p className="text-xs text-slate-500">Xisaabinta Dakhliga, Daymaha, Iibka iyo Khasnadda Lacagta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick POS Shortcut */}
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Iib Cusub (POS)</span>
            </button>

            {/* Cash Drawer Status Indicator */}
            <div
              onClick={() => navigate('/cash')}
              className="cursor-pointer hidden md:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-600 font-medium">
                {activeSession ? 'Khasnaddu Waa Furan Tahay' : 'Khasnaddu Waa Xidhan Tahay'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

