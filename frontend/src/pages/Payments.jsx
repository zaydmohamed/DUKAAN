import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { formatMoney } from '../services/api';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle,
  CreditCard,
  Printer,
  X,
  AlertCircle,
  Wallet,
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();

  // Payment form state
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [allocationMethod, setAllocationMethod] = useState('FIFO_OLDEST_FIRST');
  const [targetSaleId, setTargetSaleId] = useState('');
  const [customerSales, setCustomerSales] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [receiptPayment, setReceiptPayment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, custRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers'),
      ]);
      if (payRes.data.success) setPayments(payRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);

      // Check query params if pre-filled from customer details
      const qCustId = searchParams.get('customerId');
      const qSaleId = searchParams.get('saleId');
      if (qCustId) {
        setCustomerId(qCustId);
        if (qSaleId) {
          setTargetSaleId(qSaleId);
          setAllocationMethod('SPECIFIC_INVOICE');
        }
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When customer changes in modal, load their unpaid sales
  useEffect(() => {
    if (customerId) {
      const fetchCustomerSales = async () => {
        try {
          const res = await api.get(`/debts/invoices?customerId=${customerId}`);
          if (res.data.success) setCustomerSales(res.data.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCustomerSales();
    } else {
      setCustomerSales([]);
    }
  }, [customerId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/payments/customer', {
        customerId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber,
        allocationMethod,
        targetSaleId: allocationMethod === 'SPECIFIC_INVOICE' ? targetSaleId : null,
        notes,
      });

      if (res.data.success) {
        setReceiptPayment(res.data.data.payment);
        setShowModal(false);
        setAmount('');
        setReferenceNumber('');
        setNotes('');
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Qabashada Lacagaha & Deyn Bixinta (Payments)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Qabo lacagaha daynta macaamiisha (Caddaan, EVC Plus, ama Bangi) kuna jar biilasha u yaalla
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Qabo Lacag Cusub
        </button>
      </div>

      {/* Accounting Notice */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
        <span>
          <strong className="font-bold">Sharciga Xisaabaadka: </strong>
          Lacagta la qabto waxay dhintaa daynta macaamilka ku maqan, waxayna kordhisaa lacagta caddaanka/bangiga. Kuma darsanto iib cusub.
        </span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Rasiidka #</th>
                <th className="p-3.5">Taariikhda & Waqtiga</th>
                <th className="p-3.5">Nooca</th>
                <th className="p-3.5">Macaamilka / Qofka</th>
                <th className="p-3.5">Habka Bixinta</th>
                <th className="p-3.5">Tixraaca (Trx ID)</th>
                <th className="p-3.5">Lacagta La Qabtay</th>
                <th className="p-3.5">Xaaladda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Lacag-bixinnada ayaa la soo rarayaa...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Weli wax lacag-bixin ah lama diiwaangelin.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{p.paymentNumber}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">
                      {p.partyType === 'CUSTOMER' ? 'Macaamil' : 'Ganacsade'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{p.partyName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.paymentMethod === 'CASH' ? 'Caddaan' : p.paymentMethod === 'EVC_PLUS' ? 'EVC Plus' : p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="p-3.5 font-bold font-mono text-emerald-600 text-sm">
                      ${(p.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {p.status === 'VALID' ? 'XAQIIQSAN' : p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Qabo Lacag Deyn ah (Macaamil)</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Dooro Macaamilka *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="">Dooro Macaamilka...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Deyn: ${(c.outstandingBalanceCents / 100).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lacagta La Qabanayo ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold font-mono text-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Habka Lacag-Bixinta *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="CASH">Caddaan (Cash)</option>
                    <option value="EVC_PLUS">EVC Plus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Habka Daynta Loo Jarayo (Allocation) *</label>
                <select
                  value={allocationMethod}
                  onChange={(e) => setAllocationMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="FIFO_OLDEST_FIRST">FIFO: Ka Bilow Biilasha Ugu Horeeyay ee Ugu Duqsan (Standard)</option>
                  <option value="SPECIFIC_INVOICE">Ku Jar Biil Gaar ah (Specific Invoice)</option>
                </select>
              </div>

              {allocationMethod === 'SPECIFIC_INVOICE' && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Dooro Biilka Gaarka ah</label>
                  <select
                    value={targetSaleId}
                    onChange={(e) => setTargetSaleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="">Dooro Biilka...</option>
                    {customerSales.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.saleNumber} - Deyn: ${(s.outstandingBalanceCents / 100).toFixed(2)} ({new Date(s.saleDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Lambarka Tixraaca (EVC Plus Trx ID)
                </label>
                <input
                  type="text"
                  placeholder="Tusaale: TX-992812"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30"
                >
                  Diiwaangeli Lacagta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 font-mono text-xs space-y-1">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
              <h3 className="font-extrabold text-base">RASIIDKA BIXINTA LACAGTA</h3>
              <p className="text-slate-500">DUKAAN Enterprise</p>
              <p className="text-slate-400">Rasiidka #: {receiptPayment.paymentNumber}</p>
            </div>

            <div className="py-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Macaamilka:</span>
                <span className="font-bold">{receiptPayment.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Habka:</span>
                <span>{receiptPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tixraaca:</span>
                <span>{receiptPayment.referenceNumber || '-'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-emerald-600">
                <span>Lacagta La Bixiyay:</span>
                <span>${(receiptPayment.amountCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Daabac Rasiidka
              </button>
              <button
                onClick={() => setReceiptPayment(null)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Xir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

