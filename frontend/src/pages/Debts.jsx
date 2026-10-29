import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatMoney } from '../services/api';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
  X,
  CheckCircle,
} from 'lucide-react';

const Debts = () => {
  const [debtData, setDebtData] = useState(null);
  const [debtInvoices, setDebtInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, invRes] = await Promise.all([
        api.get('/debts/dashboard'),
        api.get('/debts/invoices'),
      ]);
      if (dashRes.data.success) setDebtData(dashRes.data.data);
      if (invRes.data.success) setDebtInvoices(invRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenWriteOff = (cust) => {
    setSelectedCustomer(cust);
    setWriteOffAmount((cust.outstandingBalanceCents / 100).toFixed(2));
    setWriteOffReason('');
    setError('');
    setShowWriteOffModal(true);
  };

  const handleCommitWriteOff = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/debts/write-off', {
        customerId: selectedCustomer._id,
        amount: Number(writeOffAmount),
        reason: writeOffReason,
      });
      setShowWriteOffModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading && !debtData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { aging, totalDebtCents, totalCustomersInDebt, topDebtors } = debtData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Maamulka Daymaha Macaamiisha (Customer Debts)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            La socodka da'da daymaha (Aging), biilasha aan bixin, iyo cafinta daymaha aan soo noqonayn (Write-off)
          </p>
        </div>

        <button
          onClick={() => navigate('/payments')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <DollarSign size={16} /> Qabo Lacag Deyn ah
        </button>
      </div>

      {/* Debt Aging Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current: 0-30 days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>0 - 30 Maalmood (Deyn Cusub)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatMoney(aging?.current0_30?.totalCents)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {aging?.current0_30?.count} biil oo waqtigooda ku jira
          </span>
        </div>

        {/* 31-60 days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>31 - 60 Maalmood (Daahey)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">
            {formatMoney(aging?.days31_60?.totalCents)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {aging?.days31_60?.count} biil oo mudadii dhaaftay
          </span>
        </div>

        {/* 61-90 days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>61 - 90 Maalmood (Khatar Galay)</span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-2xl font-extrabold text-orange-600 font-mono">
            {formatMoney(aging?.days61_90?.totalCents)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {aging?.days61_90?.count} biil oo aad u daahey
          </span>
        </div>

        {/* 90+ days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm bg-rose-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 mb-2">
            <span>90+ Maalmood (Halis / Dhimasho)</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 font-mono">
            {formatMoney(aging?.over90?.totalCents)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {aging?.over90?.count} biil oo laga yaabo in la cafiyo
          </span>
        </div>
      </div>

      {/* Invoice-Level Debt Tracking */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Biilasha Daynta ah ee Macaamiisha Ku Maqan</h3>
            <p className="text-xs text-slate-500">Iibkii deynta ahaa oo faahfaahsan biil-biil</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Wadarta Daynta: ${(totalDebtCents / 100).toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Biilka #</th>
                <th className="p-3.5">Taariikhda</th>
                <th className="p-3.5">Macaamilka</th>
                <th className="p-3.5">Wadarta Biilka</th>
                <th className="p-3.5">Wixii La Bixiyay</th>
                <th className="p-3.5">Haraaga Daynta</th>
                <th className="p-3.5">Mudada (Aging)</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debtInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    Wax deyn ah laguma laha macaamiisha! Dhammaan iibka waa la wada bixiyay.
                  </td>
                </tr>
              ) : (
                debtInvoices.map((inv) => {
                  const ageDays = Math.floor((Date.now() - new Date(inv.saleDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{inv.saleNumber}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.saleDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {inv.customer?.name || inv.customerName}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        ${(inv.totalAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-600">
                        ${(inv.amountPaidCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-rose-600">
                        ${(inv.outstandingBalanceCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ageDays <= 30
                              ? 'bg-emerald-100 text-emerald-700'
                              : ageDays <= 60
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {ageDays} maalmood
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() =>
                            navigate(
                              `/payments?customerId=${inv.customer?._id || ''}&saleId=${inv._id}`
                            )
                          }
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Qabo Lacag
                        </button>
                        {inv.customer && (
                          <button
                            onClick={() => handleOpenWriteOff(inv.customer)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                          >
                            Cafi Daynta
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bad Debt Write-off Modal */}
      {showWriteOffModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-600" /> Cafinta Daynta aan Soo Noqonayn (Write-Off)
              </h3>
              <button onClick={() => setShowWriteOffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <div className="my-3 p-3 bg-rose-50 rounded-xl text-xs space-y-1 text-rose-950">
              <div>Macaamilka: <span className="font-bold">{selectedCustomer.name}</span></div>
              <div>
                Daynta Guud: <span className="font-bold font-mono">${(selectedCustomer.outstandingBalanceCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCommitWriteOff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Lacagta Laga Cafinayo ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={(selectedCustomer.outstandingBalanceCents / 100).toFixed(2)}
                  value={writeOffAmount}
                  onChange={(e) => setWriteOffAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Sababta Loo Cafinayo (Audited Accounting Reason) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Sharax sababta dayntaan loo cafiyay (tusaale: macaamilkii oo guuray, heshiis maxkamadeed, ama awood darro)..."
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWriteOffModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/30"
                >
                  Xaqiiji Cafinta Daynta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;

