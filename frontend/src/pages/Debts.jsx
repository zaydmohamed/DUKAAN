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
  Package,
  Plus,
  Layers,
  Search,
} from 'lucide-react';

const Debts = () => {
  const [debtData, setDebtData] = useState(null);
  const [debtInvoices, setDebtInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Category creation directly inside Debts / POS
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // Payment collection modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payError, setPayError] = useState('');

  // Bad Debt Write-Off modal
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', { name: catName, description: catDesc });
      setCatSuccess('Category-ga si guul leh ayaa loo daray!');
      setCatName('');
      setCatDesc('');
      setTimeout(() => {
        setCatSuccess('');
        setShowCatModal(false);
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount((inv.outstandingBalanceCents / 100).toFixed(2));
    setPayMethod('CASH');
    setPayRef('');
    setPayError('');
    setShowPayModal(true);
  };

  const handleCommitPayment = async (e) => {
    e.preventDefault();
    setPayError('');
    try {
      const amountNum = parseFloat(payAmount);
      if (!amountNum || amountNum <= 0) {
        setPayError('Fadlan geli lacag sax ah');
        return;
      }

      await api.post('/payments/customer', {
        customerId: selectedInvoice.customer?._id,
        amount: amountNum,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        allocationMethod: 'SPECIFIC_INVOICE',
        specificSaleId: selectedInvoice._id,
      });

      setShowPayModal(false);
      loadData();
    } catch (err) {
      setPayError(err.response?.data?.message || err.message);
    }
  };

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

  const filteredInvoices = debtInvoices.filter((inv) => {
    const custName = inv.customer?.name || inv.customerName || '';
    const items = inv.items?.map((it) => it.productName).join(' ') || '';
    const query = searchTerm.toLowerCase();
    return custName.toLowerCase().includes(query) || items.toLowerCase().includes(query) || inv.saleNumber.toLowerCase().includes(query);
  });

  if (loading && !debtData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { aging, totalDebtCents, totalCustomersInDebt, topDebtors } = debtData || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Customer Debts & Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaanka faahfaahsan: Magaca macmiilka, alaabta uu qaatay, wixii uu bixiyay, iyo inta ku dhiman
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold transition"
          >
            <Layers size={15} /> + Category Cusub
          </button>
        </div>
      </div>

      {/* Debt Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wadarta Daymaha Maqan</span>
            <span className="text-2xl font-black text-rose-600 font-mono">
              ${((totalDebtCents || 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <User size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Macaamiisha Deyn Ku Leedahay</span>
            <span className="text-2xl font-black text-slate-800">{totalCustomersInDebt || 0} Qof</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Habka Qabashada</span>
            <span className="text-sm font-bold text-slate-700">Caddaan (Cash) & EVC Plus</span>
          </div>
        </div>
      </div>

      {/* Main Table: Detailed Debts with Items, Paid, and Remaining */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-800">
              Biilasha Deynta ah (Faahfaahsan)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
              {filteredInvoices.length} Biil
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi macmiil ama alaab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Macaamilka</th>
                <th className="p-3.5">Biilka #</th>
                <th className="p-3.5">Alaabta Uu Qaatay (Items)</th>
                <th className="p-3.5">Wadarta Iibka</th>
                <th className="p-3.5">Wixii Uu Bixiyay</th>
                <th className="p-3.5">Inta Ku Harsan (Deyn)</th>
                <th className="p-3.5">Taariikhda</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    Wax deyn ah laguma laha macaamiisha xilligan!
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const custName = inv.customer?.name || inv.customerName || 'Macaamil';
                  const phone = inv.customer?.phone || '';
                  const total = inv.totalAmountCents / 100;
                  const paid = inv.amountPaidCents / 100;
                  const remaining = inv.outstandingBalanceCents / 100;

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">{custName}</div>
                        {phone && <div className="text-[10px] text-slate-500 font-mono">{phone}</div>}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-700">
                        {inv.saleNumber}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-0.5">
                          {inv.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span>{it.productName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({it.quantity} {it.unit || 'xabbo'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        ${total.toFixed(2)}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-emerald-600">
                        ${paid.toFixed(2)}
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-extrabold text-rose-600 text-sm bg-rose-50 px-2 py-1 rounded-lg">
                          ${remaining.toFixed(2)}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.saleDate).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          Qabo Lacag
                        </button>
                        {inv.customer && (
                          <button
                            onClick={() => handleOpenWriteOff(inv.customer)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition"
                          >
                            Cafi
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

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" /> Ku Dar Category Cusub
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {catSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle size={16} /> {catSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Category-ga *</label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Cunto, Cabitaanno, Qalab..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Sharaxaadda (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Faahfaahin kooban..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Keydi Category-ga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Qabo Lacag Deyn ah</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Macmiilka:</span>
                <span>{selectedInvoice.customer?.name || selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biilka #:</span>
                <span className="font-mono">{selectedInvoice.saleNumber}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Deynta Harsan:</span>
                <span className="font-mono text-sm">${(selectedInvoice.outstandingBalanceCents / 100).toFixed(2)}</span>
              </div>
            </div>

            {payError && (
              <div className="mb-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl">
                {payError}
              </div>
            )}

            <form onSubmit={handleCommitPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Cadadka Lacagta La Bixinayo ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Habka Lacagta *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="CASH">Caddaan (Cash)</option>
                  <option value="EVC_PLUS">EVC Plus (Mobile Money)</option>
                </select>
              </div>

              {payMethod === 'EVC_PLUS' && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lambarka Tixraaca (Trx ID)</label>
                  <input
                    type="text"
                    placeholder="Tusaale: TX-129384"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Xaqiiji Lacagta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bad Debt Write-Off Modal */}
      {showWriteOffModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Cafi Daynta (Write-Off)</h3>
              <button onClick={() => setShowWriteOffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

            <form onSubmit={handleCommitWriteOff} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Macmiilka</label>
                <input
                  type="text"
                  disabled
                  value={selectedCustomer.name}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cadadka La Cafinayo ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={writeOffAmount}
                  onChange={(e) => setWriteOffAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Sababta Rasmiga ah (Audited Reason) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Sababta deynta loo cafinayo..."
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
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
                >
                  Xaqiiji Cafinta
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
