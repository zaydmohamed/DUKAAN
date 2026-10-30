import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  CreditCard,
  Building2,
  Users,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  TrendingUp,
  Scale,
  Wallet,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Exactly the required 13 Modules requested by User
  const navItems = [
    { name: 'Sales Management (POS & Iibka)', path: '/pos', icon: ShoppingCart },
    { name: 'Purchase Management (Soo Iibsiga)', path: '/purchases', icon: Truck },
    { name: 'Inventory Management (Bakhaarka)', path: '/inventory', icon: Package },
    { name: 'Customer Debts (Daymaha Macaamiisha)', path: '/debts', icon: CreditCard },
    { name: 'Supplier Debts (Daymaha Shirkadaha)', path: '/suppliers', icon: Building2 },
    { name: 'Employee Management (Shaqaalaha)', path: '/employees', icon: Users },
    { name: 'Monthly Salary (Mushaharka)', path: '/employees', icon: DollarSign },
    { name: 'Expenses Management (Kharashaadka)', path: '/expenses', icon: TrendingDown },
    { name: 'Owner Drawing (Milkiilaha)', path: '/owner-drawings', icon: ArrowUpRight },
    { name: 'Profit & Loss (Faa\'iidada & Khasaaraha)', path: '/reports?tab=net-profit-loss', icon: TrendingUp },
    { name: 'Balance Sheet (Hantida & Deymaha)', path: '/balance-sheet', icon: Scale },
    { name: 'Cash Flow (Socodka Lacagta)', path: '/reports?tab=cash-flow', icon: Wallet },
    { name: 'Daily & Monthly Reports (Warbixinnada)', path: '/reports', icon: BarChart3 },
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
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
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
              <span className="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Enterprise</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            <LayoutDashboard size={17} />
            <span>Bogga Guud (Dashboard)</span>
          </NavLink>

          <div className="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Nidaamka Dukaanka
          </div>

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path.split('?')[0];
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 uppercase font-mono">
                  {user?.role === 'ADMIN' ? 'Maamule' : user?.role || 'User'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Ka bax nidaamka"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-extrabold text-slate-800 hidden sm:block">
              DUKAAN Enterprise Shop System
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              ● Nidaamka Wuu Shaqeynayaa
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
