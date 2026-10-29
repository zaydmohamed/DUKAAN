import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Layers, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', code: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCategory(c);
    setFormData({ name: c.name, code: c.code, description: c.description || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedCategory) {
        await api.put(`/categories/${selectedCategory._id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto qeybtaan?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Qeybaha Alaabta (Categories)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            U kala saar alaabta dukaanka qeybo kala duwan (sida Raashin, Cabitaanno, Nadiifiye, iwm)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
        >
          <Plus size={16} /> Ku Dar Qeyb Cusub
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3.5">Magaca Qeybta</th>
              <th className="p-3.5">Koodhka</th>
              <th className="p-3.5">Faahfaahinta</th>
              <th className="p-3.5 text-right">Ficillada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">Qeybaha ayaa la soo rarayaa...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">Weli wax qeyb ah lama abuurin.</td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3.5 font-mono text-slate-600 font-bold">{c.code}</td>
                  <td className="p-3.5 text-slate-500">{c.description || '-'}</td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold"
                    >
                      Wax Ka Beddel
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold"
                    >
                      Tirtir
                    </button>
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
              <h3 className="text-base font-bold text-slate-800">
                {selectedCategory ? 'Wax Ka Beddel Qeybta' : 'Ku Dar Qeyb Cusub'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Magaca Qeybta *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Koodhka Gaaban (Code)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Tusaale: GROCERY"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Faahfaahin Kooban</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Kaydi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

