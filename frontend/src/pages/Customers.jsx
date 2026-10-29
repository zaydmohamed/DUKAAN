import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatMoney } from '../services/api';
import {
  Users,
  Plus,
  Search,
  CreditCard,
  FileText,
  DollarSign,
  Phone,
  Mail,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [withDebtOnly, setWithDebtOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    openingBalance: '0',
    creditLimit: '0',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = `/customers?search=${search}`;
      if (withDebtOnly) url += '&withDebtOnly=true';
      const res = await api.get(url);
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, withDebtOnly]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/customers', formData);
      setShowModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        openingBalance: '0',
        creditLimit: '0',
      });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diiwaanka Macaamiisha & Daymaha (Customers)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maamul xogta macaamiisha, xaddiga daynta la siin karo, iyo xisaab-xirka daymaha ku maqan
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Diiwaangeli Macaamil Cusub
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ka raadi macaamiisha magaca ama telefoonka..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setWithDebtOnly(!withDebtOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            withDebtOnly
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CreditCard size={14} /> Kuwa Daynta Lagu Leeyahay Kaliya
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Magaca Macaamilka</th>
                <th className="p-3.5">Telefoonka & Xiriirka</th>
                <th className="p-3.5">Xadka Daynta</th>
                <th className="p-3.5">Wadarta Iibka</th>
                <th className="p-3.5">Wadarta La Bixiyay</th>
                <th className="p-3.5">Daynta Ku Maqan</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Macaamiisha ayaa la soo rarayaa...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Wax macaamiil ah lama helin.</td>
                </tr>
              ) : (
                customers.map((c) => {
                  const hasDebt = c.outstandingBalanceCents > 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.notes || 'Macaamil Caadi ah'}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{c.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400">{c.email || ''}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {c.creditLimitCents > 0 ? `$${(c.creditLimitCents / 100).toFixed(2)}` : 'Aan Xaddidnayn'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        ${(c.totalCreditSalesCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono text-emerald-600 font-bold">
                        ${(c.totalPaymentsCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={hasDebt ? 'text-rose-600' : 'text-slate-400'}>
                          ${(c.outstandingBalanceCents / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => navigate(`/customers/${c._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Bayaanka
                        </button>
                        {hasDebt && (
                          <button
                            onClick={() => navigate(`/payments?customerId=${c._id}`)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition"
                          >
                            Qabo Lacag
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

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Macaamil Cusub</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Oo Buuxa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Dayntii Hore Ku Maqnayd ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Xadka Daynta La Siiyo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="0 haddii aysan xaddidnayn"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cinwaanka / Goobta</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Xusuusin / Faallo</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Kaydi Macaamilka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

