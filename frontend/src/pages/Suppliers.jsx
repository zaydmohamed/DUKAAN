import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import { Truck, Plus, DollarSign, Search, Phone, Mail, X, AlertCircle } from 'lucide-react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
  });

  const [payData, setPayData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: '',
  });

  const [error, setError] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/suppliers?search=${search}`);
      if (res.data.success) setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/suppliers', formData);
      setShowSupplierModal(false);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        openingBalance: '0',
      });
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleOpenPay = (s) => {
    setSelectedSupplier(s);
    setPayData({
      amount: (s.outstandingBalanceCents / 100).toFixed(2),
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    });
    setError('');
    setShowPayModal(true);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/payments/supplier', {
        supplierId: selectedSupplier._id,
        amount: Number(payData.amount),
        paymentMethod: payData.paymentMethod,
        referenceNumber: payData.referenceNumber,
        notes: payData.notes,
      });
      setShowPayModal(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Ganacsatada Alaabta Keenta (Suppliers)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maamul shirkadaha aad alaabta ka soo iibsato, daymaha ay kugu leeyihiin, iyo lacagaha aad siiso
          </p>
        </div>

        <button
          onClick={() => {
            setShowSupplierModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Diiwaangeli Shirkad Cusub
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ka raadi shirkadaha magaca ama telefoonka..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Shirkadda / Ganacsadaha</th>
                <th className="p-3.5">Qofka Mas'uulka ah</th>
                <th className="p-3.5">Telefoonka & Xiriirka</th>
                <th className="p-3.5">Wadarta Alaabta Laga Soo Iibsaday</th>
                <th className="p-3.5">Wadarta La Siiyay</th>
                <th className="p-3.5">Daynta Ay Kugu Leeyihiin</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Shirkadaha ayaa la soo rarayaa...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Weli wax shirkad ah lama diiwaangelin.</td>
                </tr>
              ) : (
                suppliers.map((s) => {
                  const hasPayable = s.outstandingBalanceCents > 0;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3.5 text-slate-600">{s.contactPerson || '-'}</td>
                      <td className="p-3.5 text-slate-600">
                        <div>{s.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400">{s.email || ''}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        ${(s.totalPurchasesCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-600 font-bold">
                        ${(s.totalPaymentsCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={hasPayable ? 'text-rose-600' : 'text-slate-400'}>
                          ${(s.outstandingBalanceCents / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {hasPayable && (
                          <button
                            onClick={() => handleOpenPay(s)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold transition"
                          >
                            Sii Lacag
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

      {/* Register Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Shirkad Cusub</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleCreateSupplier} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Shirkadda ama Ganacsadaha *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Qofka Mas'uulka ah</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Telefoonka</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cinwaanka / Bakhaarka</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Dayntii Hore Kuugu Lahaayeen ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Kaydi Shirkadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Sii Lacag Shirkadda</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>Shirkadda: <span className="font-bold">{selectedSupplier.name}</span></div>
              <div>
                Daynta Laguugu Leeyahay: <span className="font-bold font-mono text-rose-600">${(selectedSupplier.outstandingBalanceCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleMakePayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lacagta La Siinayo ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payData.amount}
                    onChange={(e) => setPayData({ ...payData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Habka Lacagta</label>
                  <select
                    value={payData.paymentMethod}
                    onChange={(e) => setPayData({ ...payData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="CASH">Caddaan (Cash)</option>
                    <option value="EVC_PLUS">EVC Plus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Lambarka Tixraaca (EVC Plus Trx ID)</label>
                <input
                  type="text"
                  placeholder="Tusaale: Trx-99201"
                  value={payData.referenceNumber}
                  onChange={(e) => setPayData({ ...payData, referenceNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Bixi Lacagta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;

