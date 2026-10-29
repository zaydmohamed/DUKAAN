import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  X,
  CheckCircle,
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    baseUnit: 'PIECE',
    costPrice: '',
    sellingPrice: '',
    currentStock: '0',
    minStockLevel: '10',
    allowNegativeStock: false,
    unitConversions: [],
  });

  const [adjustData, setAdjustData] = useState({
    quantityChange: '',
    movementType: 'ADJUSTMENT',
    reason: '',
  });

  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?search=${search}&category=${selectedCategory}`;
      if (lowStockFilter) url += '&lowStock=true';
      const [prodRes, catRes] = await Promise.all([api.get(url), api.get('/categories')]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, lowStockFilter]);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0]?._id || '',
      baseUnit: 'PIECE',
      costPrice: '',
      sellingPrice: '',
      currentStock: '0',
      minStockLevel: '10',
      allowNegativeStock: false,
      unitConversions: [],
    });
    setError('');
    setShowProductModal(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category?._id || p.category || '',
      baseUnit: p.baseUnit,
      costPrice: (p.costPriceCents / 100).toFixed(2),
      sellingPrice: (p.sellingPriceCents / 100).toFixed(2),
      minStockLevel: String(p.minStockLevel),
      allowNegativeStock: p.allowNegativeStock,
      unitConversions: p.unitConversions || [],
    });
    setError('');
    setShowProductModal(true);
  };

  const handleOpenAdjust = (p) => {
    setSelectedProduct(p);
    setAdjustData({
      quantityChange: '',
      movementType: 'ADJUSTMENT',
      reason: '',
    });
    setError('');
    setShowAdjustModal(true);
  };

  // Add conversion row in product modal
  const addConversionRow = () => {
    setFormData({
      ...formData,
      unitConversions: [
        ...formData.unitConversions,
        { unitName: 'CARTON', multiplier: 12, sellingPrice: '' },
      ],
    });
  };

  const removeConversionRow = (idx) => {
    setFormData({
      ...formData,
      unitConversions: formData.unitConversions.filter((_, i) => i !== idx),
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post(`/products/${selectedProduct._id}/adjust-stock`, adjustData);
      setShowAdjustModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Maamulka Alaabta & Bakhaarka (Products)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ku dar alaabo cusub, habee qiimaha raasamaalka & iibka, iyo xaddiga bakhaarka yaalla
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus size={16} /> Ku Dar Alaab Cusub
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
            placeholder="Ka raadi alaabta magaca, lambarka SKU, ama barcode..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <option value="">Dhammaan Qeybaha Alaabta</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${lowStockFilter
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          <AlertTriangle size={14} /> Dhammaadka Ku Dhaw
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Faahfaahinta Alaabta</th>
                <th className="p-3.5">Qeybta</th>
                <th className="p-3.5">Halbeega</th>
                <th className="p-3.5">Raasamaalka (Cost)</th>
                <th className="p-3.5">Qiimaha Iibka</th>
                <th className="p-3.5">Kaydka Yaalla</th>
                <th className="p-3.5">Xaaladda</th>
                <th className="p-3.5 text-right">Ficillada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-400 font-medium">
                    Alaabta ayaa la soo rarayaa...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-400 font-medium">
                    Wax alaab ah lama helin.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          SKU: {p.sku} {p.barcode ? `| Barcode: ${p.barcode}` : ''}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">
                        {p.category?.name || 'Guud'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">
                        {p.baseUnit}
                        {p.unitConversions?.length > 0 && (
                          <div className="text-[10px] text-indigo-600 font-normal">
                            +{p.unitConversions.length} halbeeg
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        ${(p.costPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900">
                        ${(p.sellingPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        {p.currentStock} {p.baseUnit}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.currentStock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          {p.currentStock <= 0 ? 'Waa Madhan' : isLow ? 'Dhammaadka Ku Dhaw' : 'Waa Buuxaa'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Hagaaji
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Wax Ka Beddel
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {showProductModal && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-800">
            {selectedProduct ? 'Wax Ka Beddel Alaabta' : 'Ku Dar Alaab Cusub'}
          </h3>
          <button
            onClick={() => setShowProductModal(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Magaca Alaabta *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Koodhka SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Si toos ah baa loo samaynayaa haddii aad ka tagto"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Barcode / UPC</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Koodhka xariiqaha"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Qeybta Alaabta *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Halbeega Koowaad (Base Unit) *</label>
              <select
                value={formData.baseUnit}
                onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium uppercase"
              >
                <option value="PIECE">Xabbo (Piece)</option>
                <option value="KG">Kiilo (kg)</option>
                <option value="GRAM">Garaam (Gram)</option>
                <option value="LITER">Litir (Liter)</option>
                <option value="METER">Mitir (Meter)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Qiimaha Raasamaalka ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Qiimaha Iibka ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-indigo-700"
              />
            </div>
          </div>

          {!selectedProduct && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Xaddiga Hadda Yaalla (Opening Stock)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Digniinta Dhammaadka (Min Stock Level)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* Multi-unit Conversions Configuration */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-700">Halbeegyada Kale (Kartoon / Baakidh)</label>
              <button
                type="button"
                onClick={addConversionRow}
                className="text-indigo-600 font-bold hover:underline text-[11px]"
              >
                + Ku Dar Halbeeg
              </button>
            </div>

            <div className="space-y-2">
              {formData.unitConversions.map((uc, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    placeholder="Magaca (tusaale: CARTON)"
                    value={uc.unitName}
                    onChange={(e) => {
                      const updated = [...formData.unitConversions];
                      updated[i].unitName = e.target.value;
                      setFormData({ ...formData, unitConversions: updated });
                    }}
                    className="w-28 uppercase px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold"
                  />
                  <span className="text-slate-400 text-[10px]">=</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Tirada"
                    value={uc.multiplier}
                    onChange={(e) => {
                      const updated = [...formData.unitConversions];
                      updated[i].multiplier = e.target.value;
                      setFormData({ ...formData, unitConversions: updated });
                    }}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold"
                  />
                  <span className="text-slate-500 text-[10px]">{formData.baseUnit}</span>
                  <button
                    type="button"
                    onClick={() => removeConversionRow(i)}
                    className="ml-auto text-rose-500 hover:text-rose-700 text-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowProductModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 transition"
            >
              Kaydi Alaabta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Stock Adjustment Modal */ }
{
  showAdjustModal && selectedProduct && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-800">
            Hagaajinta Xaddiga Bakhaarka
          </h3>
          <button
            onClick={() => setShowAdjustModal(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
          <div className="font-bold text-slate-900">{selectedProduct.name}</div>
          <div className="text-slate-500">
            Xaddiga Hadda Yaalla: <span className="font-bold text-slate-800">{selectedProduct.currentStock} {selectedProduct.baseUnit}</span>
          </div>
        </div>

        <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Sababta / Nooca Hagaajinta *</label>
            <select
              value={adjustData.movementType}
              onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
            >
              <option value="ADJUSTMENT">Hagaajin Guud (General Stock Adjustment)</option>
              <option value="DAMAGE">Alaab Hallawday / Qasaartay (Damage - Jarid)</option>
              <option value="LOSS">Alaab Luntay / Dhuntay (Loss - Jarid)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">
              Tirada La Beddelayo (+ Haddii aad kordhinayso, - Haddii aad goynayso) *
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="Tusaale: +5 ama -2"
              value={adjustData.quantityChange}
              onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Sharaxaadda Sababta (Audited Reason) *</label>
            <textarea
              required
              rows={2}
              placeholder="Sharax sababta xaddigaan loo beddelay..."
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 transition"
            >
              Xaqiiji Hagaajinta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
    </div >
  );
};

export default Products;

