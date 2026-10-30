import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Users,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle,
  Briefcase,
  UserCheck,
  TrendingDown,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff',
    phone: '',
    monthlySalary: '',
    joinDate: new Date().toISOString().split('T')[0],
  });

  const [payData, setPayData] = useState({
    amount: '',
    month: new Date().toLocaleString('so-SO', { month: 'long', year: 'numeric' }),
    paymentMethod: 'CASH',
    notes: '',
  });

  // Load from local storage or initialize
  useEffect(() => {
    const saved = localStorage.getItem('dukaan_employees');
    if (saved) {
      try {
        setEmployees(JSON.parse(saved));
      } catch (e) {
        setEmployees([]);
      }
    } else {
      const initial = [
        { id: '1', name: 'Axmed Maxamed', role: 'Khasnaji (Cashier)', phone: '0615123456', monthlySalary: 250, paidHistory: [] },
        { id: '2', name: 'Faarax Cali', role: 'Maamulaha Bakhaarka', phone: '0615789012', monthlySalary: 300, paidHistory: [] },
      ];
      setEmployees(initial);
      localStorage.setItem('dukaan_employees', JSON.stringify(initial));
    }
    setLoading(false);
  }, []);

  const saveEmployees = (updated) => {
    setEmployees(updated);
    localStorage.setItem('dukaan_employees', JSON.stringify(updated));
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    const newEmp = {
      id: Date.now().toString(),
      name: formData.name,
      role: formData.role,
      phone: formData.phone,
      monthlySalary: parseFloat(formData.monthlySalary) || 0,
      joinDate: formData.joinDate,
      paidHistory: [],
    };
    const updated = [...employees, newEmp];
    saveEmployees(updated);
    setShowModal(false);
    setFormData({ name: '', role: 'Staff', phone: '', monthlySalary: '', joinDate: new Date().toISOString().split('T')[0] });
  };

  const handleOpenPay = (emp) => {
    setSelectedEmp(emp);
    setPayData({
      amount: emp.monthlySalary,
      month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      paymentMethod: 'CASH',
      notes: `Mushaharka bisha ${new Date().toLocaleString('en-US', { month: 'long' })}`,
    });
    setShowPayModal(true);
  };

  const handlePaySalary = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const paymentRecord = {
      id: Date.now().toString(),
      amount: parseFloat(payData.amount),
      month: payData.month,
      date: new Date().toISOString(),
      paymentMethod: payData.paymentMethod,
      notes: payData.notes,
    };

    // Also record into Expenses system automatically so P&L and Cash reflects it
    try {
      await api.post('/expenses', {
        category: 'SALARIES',
        amountCents: Math.round(parseFloat(payData.amount) * 100),
        paymentMethod: payData.paymentMethod,
        description: `Mushahar: ${selectedEmp.name} - ${payData.month}`,
        referenceNumber: `SAL-${Date.now().toString().slice(-6)}`,
      });
    } catch (err) {
      console.error('Error logging salary expense:', err);
    }

    const updated = employees.map((emp) => {
      if (emp.id === selectedEmp.id) {
        return {
          ...emp,
          paidHistory: [paymentRecord, ...(emp.paidHistory || [])],
        };
      }
      return emp;
    });

    saveEmployees(updated);
    setShowPayModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Ma hubtaa inaad tirtirto shaqaalahan?')) {
      const updated = employees.filter((e) => e.id !== id);
      saveEmployees(updated);
    }
  };

  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (parseFloat(e.monthlySalary) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Employee Management & Monthly Salary</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maamulka shaqaalaha, xisaabinta mushaharka bil kasta, iyo bixinta tooska ah
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
        >
          <Plus size={16} /> Ku Dar Shaqaale Cusub
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wadarta Shaqaalaha</span>
            <span className="text-2xl font-black text-slate-800">{employees.length} Qof</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Miisaaniyadda Mushaharka Bishii</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">${totalMonthlyPayroll.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <CreditCard size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Habka Bixinta</span>
            <span className="text-sm font-bold text-slate-700">Caddaan (Cash) & EVC Plus</span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3.5">Magaca Shaqaalaha</th>
              <th className="p-3.5">Doorka / Shaqada</th>
              <th className="p-3.5">Telefoonka</th>
              <th className="p-3.5">Mushaharka Bishii</th>
              <th className="p-3.5">Bixintii Ugu Dambeysay</th>
              <th className="p-3.5 text-right">Ficillada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Weli wax shaqaale ah lama diiwaangelin.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const lastPayment = emp.paidHistory && emp.paidHistory.length > 0 ? emp.paidHistory[0] : null;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-800">{emp.name}</td>
                    <td className="p-3.5 text-slate-600">{emp.role}</td>
                    <td className="p-3.5 font-mono text-slate-600">{emp.phone}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600 text-sm">
                      ${emp.monthlySalary.toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      {lastPayment ? (
                        <div>
                          <span className="font-semibold text-slate-700">{lastPayment.month}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            ${lastPayment.amount} • {new Date(lastPayment.date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          Weli Lama Siinin
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPay(emp)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Bixi Mushaharka
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Shaqaale Cusub</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  placeholder="Axmed Maxamed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Doorka / Xilka *</label>
                <input
                  type="text"
                  required
                  placeholder="Khasnaji, Bakhaar-haye, iwm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Telefoonka *</label>
                <input
                  type="text"
                  required
                  placeholder="061xxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mushaharka Bishii ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="200"
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Keydi Shaqaalaha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPayModal && selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Bixi Mushaharka</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{selectedEmp.name}</div>
              <div className="text-slate-500">{selectedEmp.role}</div>
            </div>

            <form onSubmit={handlePaySalary} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Bisha Mushaharka *</label>
                <input
                  type="text"
                  required
                  value={payData.month}
                  onChange={(e) => setPayData({ ...payData, month: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Cadadka Lacagta ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payData.amount}
                  onChange={(e) => setPayData({ ...payData, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold font-mono text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Habka Bixinta *</label>
                <select
                  value={payData.paymentMethod}
                  onChange={(e) => setPayData({ ...payData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="CASH">Caddaan (Cash)</option>
                  <option value="EVC_PLUS">EVC Plus</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Faahfaahin / Xusuusin</label>
                <input
                  type="text"
                  value={payData.notes}
                  onChange={(e) => setPayData({ ...payData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Xaqiiji Bixinta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

