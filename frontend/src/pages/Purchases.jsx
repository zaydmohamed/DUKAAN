import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Package,
} from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [freightCost, setFreightCost] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [receivedNow, setReceivedNow] = useState(true);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: '', unit: 'PIECE', quantity: 1, unitCost: 0 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purRes, suppRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      if (purRes.data.success) setPurchases(purRes.data.data);
      if (suppRes.data.success) {
        setSuppliers(suppRes.data.data);
        if (suppRes.data.data.length > 0 && !supplierId) {
          setSupplierId(suppRes.data.data[0]._id);
        }
      }
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => {
    setItems([...items, { productId: products[0]?._id || '', unit: 'PIECE', quantity: 1, unitCost: 0 }]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;

    if (field === 'productId') {
      const p = products.find((prod) => prod._id === val);
      if (p) {
        updated[idx].unit = p.baseUnit;
        updated[idx].unitCost = (p.costPriceCents / 100).toFixed(2);
      }
    }
    setItems(updated);
  };

  const calculateTotal = () => {
    const goods = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);
    return goods + (Number(freightCost) || 0);
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        supplierId,
        items: items.map((i) => ({
          productId: i.productId,
          unit: i.unit,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
        freightAndAdditionalCost: Number(freightCost),
        amountPaid: Number(amountPaid),
        paymentMethod,
        receivedNow,
        notes,
      };

      const res = await api.post('/purchases', payload);
      if (res.data.success) {
        setShowModal(false);
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleReceiveGoods = async (id) => {
    if (!window.confirm('Accept shipment into inventory? This updates current stock and recalculates weighted average costs.')) {
      return;
    }
    try {
      await api.post(`/purchases/${id}/receive`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Alaab Soo Iibsashada (Purchases)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaangeli alaabaha shirkadaha laga soo iibsaday, kharashka rarka, iyo kordhinta bakhaarka
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Iibsi Cusub (New Purchase)
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Iibsiga #</th>
                <th className="p-3.5">Taariikhda</th>
                <th className="p-3.5">Shirkadda</th>
                <th className="p-3.5">Qiimaha Alaabta</th>
                <th className="p-3.5">Rarka & Gaadiidka</th>
                <th className="p-3.5">Wadarta Guud</th>
                <th className="p-3.5">La Bixiyay</th>
                <th className="p-3.5">Daynta Harta</th>
                <th className="p-3.5">Bakhaarka</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Iibsiga ayaa la soo rarayaa...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Weli wax iibsi ah lama diiwaangelin.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{p.purchaseNumber}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{p.supplier?.name}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      ${(p.goodsCostCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      ${(p.freightAndAdditionalCostCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      ${(p.totalPurchaseCostCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">
                      ${(p.amountPaidCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-rose-600 font-bold">
                      ${(p.outstandingBalanceCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.receivedStatus === 'RECEIVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.receivedStatus === 'RECEIVED' ? 'WAA LA HELAY' : 'WAA LA SUGAYAA'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {p.receivedStatus === 'PENDING' && (
                        <button
                          onClick={() => handleReceiveGoods(p._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition"
                        >
                          Qabo Alaabta
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

      {/* New Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Diiwaangeli Alaab Cusub oo La Soo Iibsaday</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Dooro Shirkadda *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Kharashka Gaadiidka & Rarka ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={freightCost}
                    onChange={(e) => setFreightCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Waxay toos ugu biiraysaa qiimaha raasamaalka</span>
                </div>
              </div>

              {/* Purchase Items List */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Alaabaha La Soo Iibsaday</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-indigo-600 font-bold hover:underline text-[11px]"
                  >
                    + Ku Dar Alaab
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        required
                        value={it.productId}
                        onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-medium"
                      >
                        <option value="">Dooro Alaabta...</option>
                        {products.map((prod) => (
                          <option key={prod._id} value={prod._id}>
                            {prod.name} ({prod.sku})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        placeholder="Tirada"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-center"
                      />

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Qiimaha"
                          value={it.unitCost}
                          onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                          className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-rose-500 hover:text-rose-700 px-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment tender at purchase time */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-bold text-sm text-slate-800">
                  <span>Wadarta Guud ee Qiimaha Iibsiga:</span>
                  <span className="text-indigo-600">${calculateTotal().toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Lacagta Hadda La Bixiyay ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Habka Lacag-Bixinta</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium"
                    >
                      <option value="CASH">Caddaan (Cash)</option>
                      <option value="EVC_PLUS">EVC Plus</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="recNow"
                    checked={receivedNow}
                    onChange={(e) => setReceivedNow(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <label htmlFor="recNow" className="font-bold text-slate-700">
                    Alaabtu hadda waxay toos u gashay bakhaarka (waxay kordhinaysaa kaydka waxayna cusboonaysiinaysaa raasamaalka)
                  </label>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Xaqiiji Iibsiga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;

