import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RotateCcw,
  AlertTriangle,
  X,
  Printer,
  CheckCircle,
} from 'lucide-react';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Return modal form state
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [returnReason, setReturnReason] = useState('');
  const [error, setError] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = `/sales?search=${search}`;
      if (statusFilter) url += `&paymentStatus=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) setSales(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, statusFilter]);

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      if (res.data.success) {
        setSelectedSale(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      alert('Failed to load sale details');
    }
  };

  const handleOpenReturn = (s) => {
    setSelectedSale({ sale: s });
    setReturnItems(
      s.items.map((it) => ({
        productId: it.product?._id || it.product,
        productName: it.productName,
        unit: it.unit,
        maxQuantity: it.quantity,
        quantity: 0,
        unitRefund: (it.unitPriceCents / 100).toFixed(2),
        isRestockable: true,
      }))
    );
    setRefundMethod('CASH');
    setReturnReason('');
    setError('');
    setShowReturnModal(true);
  };

  const handleVoidSale = async (id) => {
    const reason = prompt('Fadlan qor sababta aad u tirtirayso/baabi\'inayso iibkaan:');
    if (!reason) return;

    try {
      await api.post(`/sales/${id}/void`, { reason });
      fetchSales();
      if (showDetailModal) setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    const activeItems = returnItems.filter((i) => Number(i.quantity) > 0);
    if (!activeItems.length) {
      setError('Fadlan dooro ugu yaraan hal alaab oo tiradeeda la soo celinayo ay ka weyn tahay 0.');
      return;
    }

    try {
      await api.post('/returns', {
        saleId: selectedSale.sale._id,
        items: activeItems,
        refundMethod,
        reason: returnReason,
      });
      setShowReturnModal(false);
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diiwaanka Iibka & Rasiidhada (Sales History)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dib u eeg dhammaan iibkii dhacay, lacagaha caddaanka ah vs deynta, iyo soo celinta alaabta (Returns)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ka raadi lambarka biilka ama magaca macaamilka..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <option value="">Dhammaan Xaaladaha Bixinta</option>
          <option value="PAID">Waa La Wada Bixiyay (Paid)</option>
          <option value="PARTIALLY_PAID">Qeyb Baa La Bixiyay (Partial)</option>
          <option value="UNPAID">Waa Deyn (Unpaid)</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Biilka #</th>
                <th className="p-3.5">Taariikhda & Waqtiga</th>
                <th className="p-3.5">Macaamilka</th>
                <th className="p-3.5">Wadarta Biilka</th>
                <th className="p-3.5">Wixii La Bixiyay</th>
                <th className="p-3.5">Daynta Ku Maqan</th>
                <th className="p-3.5">Xaaladda Bixinta</th>
                <th className="p-3.5">Xaaladda Iibka</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Diiwaanka iibka ayaa la soo rarayaa...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Weli wax iib ah lama helin.</td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{s.saleNumber}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(s.saleDate).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {s.customer?.name || s.customerName || 'Socoto'}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      ${(s.totalAmountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">
                      ${(s.amountPaidCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-600">
                      ${(s.outstandingBalanceCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {s.paymentStatus === 'PAID' ? 'WAA LA BIXIYAY' : s.paymentStatus === 'PARTIALLY_PAID' ? 'QEYB BAXDAY' : 'DEYN'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.transactionStatus === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700'
                            : s.transactionStatus === 'VOIDED'
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {s.transactionStatus === 'COMPLETED' ? 'DHAMMAYSTIRAN' : s.transactionStatus === 'VOIDED' ? 'BAAQDAY' : s.transactionStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenDetail(s._id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                      >
                        Eeg
                      </button>
                      {s.transactionStatus === 'COMPLETED' && (
                        <button
                          onClick={() => handleOpenReturn(s)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Soo Celi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Invoice {selectedSale.sale.saleNumber}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {new Date(selectedSale.sale.saleDate).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Customer:</span>
                  <div className="font-bold text-slate-800">
                    {selectedSale.sale.customer?.name || selectedSale.sale.customerName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Cashier:</span>
                  <div className="font-bold text-slate-800">{selectedSale.sale.cashier?.name}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Purchased Items</h4>
                <div className="space-y-1.5">
                  {selectedSale.sale.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-bold text-slate-800">{it.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          {it.quantity} {it.unit} @ ${(it.unitPriceCents / 100).toFixed(2)}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        ${(it.lineTotalCents / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accounting Summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span>${(selectedSale.sale.subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total Net Revenue:</span>
                  <span>${(selectedSale.sale.totalAmountCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Amount Paid:</span>
                  <span>${(selectedSale.sale.amountPaidCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Outstanding Receivable:</span>
                  <span>${(selectedSale.sale.outstandingBalanceCents / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Allocations history */}
              {selectedSale.allocations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">Payment Allocations</h4>
                  <div className="space-y-1">
                    {selectedSale.allocations.map((a, i) => (
                      <div key={i} className="flex justify-between p-2 bg-emerald-50 text-emerald-900 rounded-lg text-[11px]">
                        <span>Payment #{a.payment?.paymentNumber || 'Initial'} ({a.allocationMethod})</span>
                        <span className="font-bold">+${(a.allocatedAmountCents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between gap-2">
                {selectedSale.sale.transactionStatus === 'COMPLETED' && (
                  <button
                    onClick={() => handleVoidSale(selectedSale.sale._id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition"
                  >
                    Void Sale
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Modal */}
      {showReturnModal && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Process Product Return & Refund</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleProcessReturn} className="mt-4 space-y-4 text-xs">
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {returnItems.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{it.productName}</span>
                      <span>Max: {it.maxQuantity} {it.unit}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Return Qty:</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={it.maxQuantity}
                          value={it.quantity}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[idx].quantity = e.target.value;
                            setReturnItems(updated);
                          }}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`restock-${idx}`}
                          checked={it.isRestockable}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[idx].isRestockable = e.target.checked;
                            setReturnItems(updated);
                          }}
                          className="rounded text-indigo-600"
                        />
                        <label htmlFor={`restock-${idx}`} className="text-[11px] font-medium text-slate-700">
                          Restockable (Saleable)
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Refund Method *</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="CASH">Cash Payout (Drawer)</option>
                  <option value="CREDIT_NOTE">Issue Credit Note</option>
                  <option value="REDUCE_DEBT">Reduce Customer Outstanding Debt</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Return Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Expired packaging, customer ordered wrong brand..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Commit Return & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

