import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Wallet,
  ArrowUpRight,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';

const OwnerDrawings = () => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    ownerName: 'Milkiilaha Dukaanka',
    paymentMethod: 'CASH',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const saved = localStorage.getItem('dukaan_owner_drawings');
    if (saved) {
      try {
        setDrawings(JSON.parse(saved));
      } catch (e) {
        setDrawings([]);
      }
    }
    setLoading(false);
  }, []);

  const saveDrawings = (updated) => {
    setDrawings(updated);
    localStorage.setItem('dukaan_owner_drawings', JSON.stringify(updated));
  };

  const handleAddDrawing = async (e) => {
    e.preventDefault();
    const newDrawing = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount) || 0,
      ownerName: formData.ownerName,
      paymentMethod: formData.paymentMethod,
      reason: formData.reason,
      date: formData.date,
    };

    // Record into expenses or cash drawer as owner equity withdrawal
    try {
      await api.post('/expenses', {
        category: 'OTHER_OPERATING_EXPENSES',
        amountCents: Math.round(parseFloat(formData.amount) * 100),
        paymentMethod: formData.paymentMethod,
        description: `Owner Drawing: ${formData.ownerName} - ${formData.reason || 'Lacag qaadasho gaar ah'}`,
        referenceNumber: `DRW-${Date.now().toString().slice(-6)}`,
      });
    } catch (err) {
      console.error(err);
    }

    const updated = [newDrawing, ...drawings];
    saveDrawings(updated);
    setShowModal(false);
    setFormData({
      amount: '',
      ownerName: 'Milkiilaha Dukaanka',
      paymentMethod: 'CASH',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const totalWithdrawn = drawings.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Owner Drawing (Lacagta Milkiilaha Qaato)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaanka lacagaha shakhsiga ah ee mulkiilaha ganacsigu kala baxo dukaanka (Owner Equity Withdrawal)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
        >
          <Plus size={16} /> Diiwaangeli Qaadasho Cusub
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wadarta La Qaatay</span>
            <span className="text-2xl font-black text-rose-600 font-mono">${totalWithdrawn.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tirada Jeer ee La Qaatay</span>
            <span className="text-2xl font-black text-slate-800">{drawings.length} Jeer</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Habka Lacagta</span>
            <span className="text-sm font-bold text-slate-700">Caddaan (Cash) & EVC Plus</span>
          </div>
        </div>
      </div>

      {/* Drawings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3.5">Taariikhda</th>
              <th className="p-3.5">Milkiilaha</th>
              <th className="p-3.5">Cadadka ($)</th>
              <th className="p-3.5">Habka Lacagta</th>
              <th className="p-3.5">Sababta / Ujeedada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drawings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Weli wax lacag qaadasho ah (drawing) lama diiwaangelin.
                </td>
              </tr>
            ) : (
              drawings.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono text-slate-500">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-3.5 font-bold text-slate-800">{d.ownerName}</td>
                  <td className="p-3.5 font-bold font-mono text-rose-600 text-sm">
                    ${parseFloat(d.amount).toFixed(2)}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {d.paymentMethod === 'CASH' ? 'Caddaan' : 'EVC Plus'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600">{d.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Drawing Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Owner Drawing</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDrawing} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Milkiilaha *</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cadadka Lacagta ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="100.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Habka Lacagta *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="CASH">Caddaan (Khasnadda dukaanka)</option>
                  <option value="EVC_PLUS">EVC Plus (Mobile money)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Taariikhda *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Sababta / Faahfaahin</label>
                <textarea
                  rows={2}
                  placeholder="Kharash shakhsi ah..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
                >
                  Xaqiiji Lacag Qaadashada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDrawings;

