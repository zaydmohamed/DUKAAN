import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Plus, User, Key, X, AlertCircle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'CASHIER',
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Maamulka Isticmaalayaasha & Shaqaalaha</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maamul xilalka shaqaalaha (Admin, Khasnaji, Bakhaar-haye) iyo furayaasha gelitaanka nidaamka
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
        >
          <Plus size={16} /> Shaqaale Cusub
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3.5">Magaca</th>
              <th className="p-3.5">Username</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Xilka / Doorka</th>
              <th className="p-3.5">Xaaladda</th>
              <th className="p-3.5">Gelitaankii Ugu Dambeeyay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Soo raraya akoonnada shaqaalaha...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3.5 font-mono text-slate-600 font-bold">{u.username}</td>
                  <td className="p-3.5 text-slate-600">{u.email}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'CASHIER'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {u.role === 'ADMIN' ? 'MAAMULE' : u.role === 'CASHIER' ? 'KHASNAJI' : 'BAKHAAR-HAYE'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">
                      {u.status === 'ACTIVE' ? 'SHAQEYNAYA' : u.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Weli Ma Galin'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Shaqaale Cusub</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Buuxa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Username Gelitaanka *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Furaha Sirta (Password) *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Doorka / Shaqada *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                >
                  <option value="ADMIN">Maamule Guud (Admin - Xuquuq Buuxda)</option>
                  <option value="CASHIER">Khasnaji (POS, Iibka & Lacag-qabashada)</option>
                  <option value="STOCK_MANAGER">Maamulaha Bakhaarka (Alaabta & Iibsiga)</option>
                </select>
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
                  Keydi Akoonka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

