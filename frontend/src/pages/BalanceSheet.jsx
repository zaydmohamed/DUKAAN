import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Scale,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
} from 'lucide-react';

const BalanceSheet = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      setLoading(true);
      try {
        const [dashRes, repRes] = await Promise.all([
          api.get('/reports/dashboard?filter=all'),
          api.get('/reports/stock-valuation'),
        ]);

        const dash = dashRes.data.data;
        const inventoryValCents = dash.totalInventoryValueCents || 0;
        const cashCents = dash.cashReceivedPeriodCents || 0;
        const customerReceivablesCents = dash.totalCustomerDebtCents || 0;
        const supplierPayablesCents = dash.totalSupplierDebtCents || 0;

        const totalAssetsCents = inventoryValCents + cashCents + customerReceivablesCents;
        const totalLiabilitiesCents = supplierPayablesCents;
        const totalEquityCents = totalAssetsCents - totalLiabilitiesCents;

        setData({
          currentAssets: {
            cash: cashCents,
            accountsReceivable: customerReceivablesCents,
            inventory: inventoryValCents,
            total: totalAssetsCents,
          },
          liabilities: {
            accountsPayable: supplierPayablesCents,
            total: totalLiabilitiesCents,
          },
          equity: {
            retainedEarnings: totalEquityCents,
            total: totalEquityCents,
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceSheet();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="text-indigo-600" /> Balance Sheet (Warbixinta Hantida & Deymaha)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard Accounting Equation: <span className="font-mono font-bold text-slate-800">Hanti (Assets) = Deymo (Liabilities) + Raasamaal (Equity)</span>
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Taariikhda: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Main Balance Sheet Statement */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
        {/* ASSETS SECTION */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b-2 border-indigo-600">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              1. HANTIDA GUUD (ASSETS)
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-600">Current Assets</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700 font-medium">Lacagta Khasnadda & Mobile-ka (Cash & Bank)</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(data.currentAssets.cash)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700 font-medium">Daymaha Macaamiisha Lagu Leeyahay (Accounts Receivable)</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(data.currentAssets.accountsReceivable)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700 font-medium">Qiimaha Alaabta Bakhaarka Ku Jirta (Inventory Valuation)</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(data.currentAssets.inventory)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 text-sm font-extrabold text-emerald-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <span>WADARTA HANTIDA (TOTAL ASSETS)</span>
              <span className="font-mono text-base">{formatMoney(data.currentAssets.total)}</span>
            </div>
          </div>
        </div>

        {/* LIABILITIES SECTION */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b-2 border-rose-600">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              2. DEYMAHA GANACSIGA LAGU LEEYAHAY (LIABILITIES)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600">Current Liabilities</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700 font-medium">Daymaha Shirkadaha & Ganacsatada (Accounts Payable)</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(data.liabilities.accountsPayable)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 text-sm font-extrabold text-rose-700 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              <span>WADARTA DEYMAHA (TOTAL LIABILITIES)</span>
              <span className="font-mono text-base">{formatMoney(data.liabilities.total)}</span>
            </div>
          </div>
        </div>

        {/* EQUITY SECTION */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b-2 border-purple-600">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              3. RAASAMAALKA MILKIILAHA (OWNER'S EQUITY)
            </h3>
            <span className="text-xs font-mono font-bold text-purple-600">Net Worth</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-700 font-medium">Faa'iidada Keydsan & Raasamaalka Saafiga ah (Retained Earnings)</span>
              <span className="font-mono font-bold text-slate-900">{formatMoney(data.equity.retainedEarnings)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 text-sm font-extrabold text-purple-700 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <span>WADARTA RAASAMAALKA (TOTAL EQUITY)</span>
              <span className="font-mono text-base">{formatMoney(data.equity.total)}</span>
            </div>
          </div>
        </div>

        {/* RECONCILIATION SUMMARY */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>Xisaab-xirka Hantida vs (Deymo + Raasamaal):</span>
          </div>
          <div className="font-mono text-emerald-400 text-sm">
            {formatMoney(data.currentAssets.total)} = {formatMoney(data.liabilities.total + data.equity.total)} (Balanced)
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;

