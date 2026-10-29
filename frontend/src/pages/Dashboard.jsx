import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatMoney } from '../services/api';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Users,
  Wallet,
  Calendar,
  AlertTriangle,
  FileText,
  Truck,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/reports/dashboard?filter=${filter}`;
      if (filter === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filter]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    fetchDashboard();
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Bar chart dataset for Income Statement breakdown
  const chartData = metrics
    ? [
        { name: 'Iibka Guud', amount: metrics.totalSalesSelectedPeriodCents / 100, fill: '#4f46e5' },
        { name: 'Raasamaalka (COGS)', amount: metrics.costOfGoodsSoldCents / 100, fill: '#f59e0b' },
        { name: 'Faa\'iidada Guud', amount: metrics.grossProfitCents / 100, fill: '#10b981' },
        { name: 'Kharashaadka', amount: metrics.operatingExpensesCents / 100, fill: '#ef4444' },
        { name: 'Faa\'iidada Saafiga', amount: metrics.netProfitCents / 100, fill: '#6366f1' },
      ]
    : [];

  const filterNames = {
    today: 'Maanta',
    yesterday: 'Shalay',
    this_week: 'Toddobaadkan',
    this_month: 'Bishan',
    this_year: 'Sanadkan',
    custom: 'Taariikh Gaar ah',
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Bar & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Bogga Guud ee Xisaabaadka Dukaanka</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xisaabinta Dakhliga, Daymaha dibedda ka maqan, iyo Dheelitirka Khasnadda
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['today', 'yesterday', 'this_week', 'this_month', 'this_year', 'custom'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterNames[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker when filter is 'custom' */}
      {filter === 'custom' && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Laga bilaabo:</span>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Ilaa:</span>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
          >
            Shaandhee Taariikhda
          </button>
        </form>
      )}

      {/* Accounting Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex items-start gap-3">
        <AlertTriangle size={18} className="text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-bold">Sharciga Xisaabaadka: </span>
          Iibka Guud wuxuu xisaabiyaa dhammaan iibkii dhacay (kaash & deynba). Lacagta Caddaanka ah waxay muujinaysaa wixii jeebka/khasnadda toos u soo galay. Daymaha la soo celiyo waxay dhintaan daynta macaamilka ku maqan, kumana darsamaan iib cusub.
        </div>
      </div>

      {/* Primary KPI Grid (Top 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Iibka Maanta (Today's Sales)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatMoney(metrics?.todaySalesCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Wadarta iibka la diiwaangeliyay maanta
          </span>
        </div>

        {/* Selected Period Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Iibka Mudada La Doortay</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatMoney(metrics?.totalSalesSelectedPeriodCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Mudada: {filterNames[filter] || filter}
          </span>
        </div>

        {/* Cash Received Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Caddaan Soo Xarooday Maanta</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">
            {formatMoney(metrics?.cashReceivedTodayCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Lacagta caddaanka ah ee dukaanka soo gashay
          </span>
        </div>

        {/* Outstanding Customer Debts (Accounts Receivable) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Daymaha Macaamiisha Ku Maqan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            {formatMoney(metrics?.outstandingCustomerDebtsCents)}
          </p>
          <button
            onClick={() => navigate('/debts')}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-1 inline-flex items-center gap-1"
          >
            Eeg & Maamul Daymaha →
          </button>
        </div>
      </div>

      {/* Accounting & Profit Metric Cards (Second Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Raasamaalka Alaabta (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">
            {formatMoney(metrics?.costOfGoodsSoldCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Qiimaha ay kugu joogtay alaabta la iibiyay
          </span>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Faa'iidada Guud (Gross Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-600">
            {formatMoney(metrics?.grossProfitCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Iibka Guud laga jaray Raasamaalka alaabta
          </span>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Kharashaadka Dukaanka</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <TrendingUp size={16} className="rotate-180" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">
            {formatMoney(metrics?.operatingExpensesCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Kirada, korontada, shaqaalaha, gaadiidka
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Faa'iidada Saafiga ah (Net Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              $
            </div>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">
            {formatMoney(metrics?.netProfitCents)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Faa'iidada dhabta ah ee dukaanka u hartay
          </span>
        </div>
      </div>

      {/* Operational Metrics (Third Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 font-medium block">Qiimaha Alaabta Bakhaarka Taal</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            {formatMoney(metrics?.totalInventoryValueCents)}
          </p>
          <span className="text-[10px] text-slate-400">Wadarta qiimaha raasamaalka kaydka</span>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 font-medium block">Lacagta Laga Filayo Khasnadda</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            {formatMoney(metrics?.expectedCashBalanceCents)}
          </p>
          <span className="text-[10px] text-slate-400">Lacagta caddaanka ee sanduuqa ku jirta</span>
        </div>

        {/* Supplier Debts (A/P) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 font-medium block">Daymaha Ganacsatadu Kugu Leeyihiin</span>
          <p className="text-lg font-bold text-slate-800 mt-1">
            {formatMoney(metrics?.outstandingSupplierDebtsCents)}
          </p>
          <span className="text-[10px] text-slate-400">Daymaha shirkadaha laga qabo</span>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <span className="text-xs text-slate-500 font-medium block">Alaabta Dhammaadka Ku Dhaw</span>
          <p
            className={`text-lg font-bold mt-1 ${
              metrics?.lowStockProductsCount > 0 ? 'text-amber-600' : 'text-slate-800'
            }`}
          >
            {metrics?.lowStockProductsCount} nooc
          </p>
          <button
            onClick={() => navigate('/products?lowStock=true')}
            className="text-[10px] text-indigo-600 hover:underline font-semibold"
          >
            Eeg Alaabaha Dhammaanaya →
          </button>
        </div>
      </div>

      {/* Visual Chart & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Accrual Income Statement Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Shaxda Faa'iidada & Qasaaraha (P&L Chart)
              </h3>
              <p className="text-xs text-slate-500">
                Iibka Guud vs Raasamaalka vs Kharashaadka vs Faa'iidada Saafiga ah
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Dhammaan Warbixinnada →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Qiimaha']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Ficillada Degdegga ah</h3>
            <p className="text-xs text-slate-500 mb-6">Hawlaha ugu muhiimsan ee maalinlaha ah</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/pos')}
                className="w-full flex items-center justify-between p-3.5 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/60 rounded-xl text-indigo-900 transition text-xs font-bold"
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingCart size={17} className="text-indigo-600" />
                  Fur Qeybta Iibka (POS)
                </span>
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => navigate('/payments')}
                className="w-full flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl text-emerald-900 transition text-xs font-bold"
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard size={17} className="text-emerald-600" />
                  Qabo Lacag Deyn ah (Macaamiil)
                </span>
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => navigate('/cash')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 transition text-xs font-bold"
              >
                <span className="flex items-center gap-2.5">
                  <Wallet size={17} className="text-slate-600" />
                  Xisaabi Khasnadda Lacagta (Cash Drawer)
                </span>
                <ArrowUpRight size={16} />
              </button>

              <button
                onClick={() => navigate('/expenses')}
                className="w-full flex items-center justify-between p-3.5 bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/60 rounded-xl text-rose-900 transition text-xs font-bold"
              >
                <span className="flex items-center gap-2.5">
                  <DollarSign size={17} className="text-rose-600" />
                  Qor Kharash Cusub oo Baxay
                </span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              DUKAAN • Nidaamka Xisaabaadka Dukaamada & Ganacsiga
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

