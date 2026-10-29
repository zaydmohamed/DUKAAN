import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import { TrendingDown, Plus, Search, Calendar, Filter, X, DollarSign, AlertCircle } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [totalCents, setTotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    category: 'RENT',
    amount: '',
    paymentMethod: 'CASH',
    description: '',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
  });

  const categories = [
    { value: 'RENT', label: 'Kirada Dukaanka ama Bakhaarka' },
    { value: 'ELECTRICITY', label: 'Korontada & Biyaha' },
    { value: 'SALARIES', label: 'Mushahaarka Shaqaalaha' },
    { value: 'TRANSPORT', label: 'Gaadiidka & Rarka' },
    { value: 'INTERNET', label: 'Internet-ka & Taleefanka' },
    { value: 'REPAIRS', label: 'Dayactirka Qalabka Dukaanka' },
    { value: 'MARKETING', label: 'Xayeysiiska & Suuqgeynta' },
    { value: 'OFFICE_SUPPLIES', label: 'Qalabka Dukaanka & Boorsooyinka Iibka' },
    { value: 'TAXES', label: 'Canshuuraha Dowladda ama Degmada' },
    { value: 'OTHER_OPERATING_EXPENSE', label: 'Kharashaadka Kale ee Dukaanka' },
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = '/expenses';
      if (categoryFilter) url += `?category=${categoryFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setExpenses(res.data.data);
        setTotalCents(res.data.totalCents || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/expenses', formData);
      setShowModal(false);
      setFormData({
        category: 'RENT',
        amount: '',
        paymentMethod: 'CASH',
        description: '',
        date: new Date().toISOString().split('T')[0],
        referenceNumber: '',
      });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Kharashaadka Dukaanka (Operating Expenses)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaangeli kirada, korontada, shaqaalaha, iyo biilasha dukaanka ee dhimaya faa'iidada
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Qor Kharash Cusub
        </button>
      </div>

      {/* Filter Bar & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <option value="">Dhammaan Qeybaha Kharashaadka</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="text-xs font-bold text-slate-700">
          Wadarta Kharashka Baxay: <span className="font-mono text-rose-600 text-sm font-extrabold">${(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Taariikhda</th>
                <th className="p-3.5">Qeybta Kharashka</th>
                <th className="p-3.5">Sharaxaadda</th>
                <th className="p-3.5">Habka Bixinta</th>
                <th className="p-3.5">Rasiidka / Foojarka #</th>
                <th className="p-3.5">Lacagta</th>
                <th className="p-3.5">Qofka Qoray</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Kharashaadka ayaa la soo rarayaa...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Weli wax kharash ah lama diiwaangelin.</td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{e.category}</td>
                    <td className="p-3.5 text-slate-600 max-w-sm">{e.description}</td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {e.paymentMethod === 'CASH' ? 'Caddaan (Khasnad)' : e.paymentMethod === 'EVC_PLUS' ? 'EVC Plus' : e.paymentMethod}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{e.referenceNumber || '-'}</td>
                    <td className="p-3.5 font-bold font-mono text-rose-600">
                      ${(e.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-slate-600">{e.recordedBy?.name || 'Nidaamka'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Qor Kharash Cusub oo Baxay</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Qeybta Kharashka *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Lacagta Baxday ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold font-mono text-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Habka Lacagta Loo Bixiyay</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  >
                    <option value="CASH">Caddaan (Cash)</option>
                    <option value="EVC_PLUS">EVC Plus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Sharaxaadda Kharashka *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Tusaale: Lacagta korontada bishan ama Kirada dukaanka..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Taariikhda</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Rasiidka / Foojarka #</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/30"
                >
                  Diiwaangeli Kharashka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

