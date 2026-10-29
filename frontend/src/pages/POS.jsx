import React, { useState, useEffect, useRef } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  User,
  Printer,
  CheckCircle,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [error, setError] = useState('');
  const searchInputRef = useRef(null);

  // Load products and customers
  const loadData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/products?status=ACTIVE'),
        api.get('/customers'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  // Add product to cart
  const addToCart = (product, unitName = null) => {
    setError('');
    const unit = unitName || product.baseUnit;
    let multiplier = 1;
    let unitPrice = product.sellingPriceCents / 100;

    if (unit !== product.baseUnit) {
      const conv = product.unitConversions?.find((u) => u.unitName === unit);
      if (conv) {
        multiplier = conv.multiplier;
        unitPrice = conv.sellingPriceCents
          ? conv.sellingPriceCents / 100
          : (product.sellingPriceCents * conv.multiplier) / 100;
      }
    }

    // Check existing item in cart
    const existingIndex = cart.findIndex(
      (item) => item.productId === product._id && item.unit === unit
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      const baseReq = newQty * multiplier;

      if (!product.allowNegativeStock && baseReq > product.currentStock) {
        setError(`Kama badin kartid xaddiga bakhaarka yaalla oo ah ${product.currentStock} ${product.baseUnit}`);
        return;
      }

      updated[existingIndex].quantity = newQty;
      setCart(updated);
    } else {
      const baseReq = 1 * multiplier;
      if (!product.allowNegativeStock && baseReq > product.currentStock) {
        setError(`Xaddiga bakhaarku kuma filna: kaliya ${product.currentStock} ${product.baseUnit} ayaa haraa`);
        return;
      }

      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          baseUnit: product.baseUnit,
          unit,
          multiplier,
          unitPrice,
          quantity: 1,
          discount: 0,
          currentStock: product.currentStock,
          allowNegativeStock: product.allowNegativeStock,
          conversions: product.unitConversions || [],
        },
      ]);
    }
  };

  // Update cart item quantity
  const updateQuantity = (index, newQty) => {
    setError('');
    const num = Math.max(0.1, Number(newQty));
    const item = cart[index];
    const baseReq = num * item.multiplier;

    if (!item.allowNegativeStock && baseReq > item.currentStock) {
      setError(`Kama badin kartid xaddiga bakhaarka yaalla oo ah ${item.currentStock} ${item.baseUnit}`);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = num;
    setCart(updated);
  };

  // Change item unit in cart
  const changeUnit = (index, newUnit) => {
    const item = cart[index];
    let multiplier = 1;
    let unitPrice = item.unitPrice;

    if (newUnit === item.baseUnit) {
      multiplier = 1;
    } else {
      const conv = item.conversions.find((c) => c.unitName === newUnit);
      if (conv) {
        multiplier = conv.multiplier;
        unitPrice = conv.sellingPriceCents ? conv.sellingPriceCents / 100 : item.unitPrice * conv.multiplier;
      }
    }

    const updated = [...cart];
    updated[index].unit = newUnit;
    updated[index].multiplier = multiplier;
    updated[index].unitPrice = unitPrice;
    setCart(updated);
  };

  // Remove item
  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice - (Number(item.discount) || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(discountTotal) || 0));

  // Default amount paid to full if empty and user clicks full pay
  const handlePayFull = () => {
    setAmountPaid(totalAmount.toFixed(2));
  };

  const handlePayZero = () => {
    setAmountPaid('0');
  };

  // Complete checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      setError('Fadlan ugu yaraan hal alaab ku dar iibka.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        items: cart.map((i) => ({
          productId: i.productId,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount || 0,
        })),
        discountTotal: Number(discountTotal) || 0,
        amountPaid: amountPaid === '' ? totalAmount : Number(amountPaid),
        paymentMethod,
        paymentReference,
        notes,
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setCart([]);
        setDiscountTotal(0);
        setAmountPaid('');
        setSelectedCustomerId('');
        setPaymentReference('');
        setNotes('');
        loadData(); // Refresh product stock levels
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Iibku wuu fashilmay.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-6">
      {/* Product Catalog & Search Column */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ka raadi alaabta magaca, lambarka SKU, ama ku dhufo Barcode-ka..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
          <button
            onClick={loadData}
            title="Dib u cusboonaysii Alaabta"
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((p) => {
            const hasConversions = p.unitConversions && p.unitConversions.length > 0;
            const isOutOfStock = p.currentStock <= 0 && !p.allowNegativeStock;

            return (
              <div
                key={p._id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        p.currentStock > p.minStockLevel
                          ? 'bg-emerald-50 text-emerald-600'
                          : p.currentStock > 0
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {p.currentStock} {p.baseUnit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-indigo-600">
                      ${(p.sellingPriceCents / 100).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">/{p.baseUnit}</span>
                  </div>

                  {/* Add Buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p, p.baseUnit)}
                      className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Plus size={13} /> {p.baseUnit}
                    </button>

                    {/* Unit conversion buttons if any (e.g. CARTON) */}
                    {hasConversions &&
                      p.unitConversions.map((uc) => (
                        <button
                          key={uc.unitName}
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p, uc.unitName)}
                          className="w-full py-1 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          + {uc.unitName} ({uc.multiplier} {p.baseUnit})
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart & Checkout Column */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={17} className="text-indigo-400" />
            <h3 className="text-sm font-bold">Kallaha Iibka (Cart)</h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-semibold">
            {cart.length} alaab
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Selector */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Macaamilka Wax Iibsanaya
          </label>
          <div className="relative">
            <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Macaamil Socoto ah (Walk-in Customer - Kaash)</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.outstandingBalanceCents > 0 ? `(Deyn: $${(c.outstandingBalanceCents / 100).toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <ShoppingCart size={36} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Kallahu Waa Madhan Yahay</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dooro alaab bidixda ku taal ama baar Barcode</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${item.unit}`} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h5 className="font-bold text-slate-800">{item.productName}</h5>
                    <span className="text-[10px] text-slate-400">
                      ${item.unitPrice.toFixed(2)} halkii {item.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  {/* Unit Selector */}
                  <select
                    value={item.unit}
                    onChange={(e) => changeUnit(idx, e.target.value)}
                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                  >
                    <option value={item.baseUnit}>{item.baseUnit}</option>
                    {item.conversions.map((c) => (
                      <option key={c.unitName} value={c.unitName}>
                        {c.unitName} (x{c.multiplier})
                      </option>
                    ))}
                  </select>

                  {/* Qty incrementer */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus size={11} />
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(idx, e.target.value)}
                      className="w-12 text-center py-0.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    />
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="font-extrabold text-slate-800">
                    ${(item.quantity * item.unitPrice - (Number(item.discount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Form & Tender */}
        <form onSubmit={handleCheckout} className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotals & Discounts */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Wadarta Alaabta:</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Qiimo-dhimis ($):</span>
              <input
                type="number"
                min="0"
                step="any"
                value={discountTotal}
                onChange={(e) => setDiscountTotal(e.target.value)}
                className="w-20 text-right px-2 py-0.5 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Wadarta Guud:</span>
              <span className="text-indigo-600 text-base">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method & Amount Paid */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Habka Lacag-Bixinta</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="CASH">Caddaan (Cash)</option>
                  <option value="EVC_PLUS">EVC Plus</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Lacagta La Bixiyay</label>
                  <div className="flex gap-1 text-[9px]">
                    <button type="button" onClick={handlePayFull} className="text-indigo-600 font-bold hover:underline">
                      Dhammaan
                    </button>
                    <span>|</span>
                    <button type="button" onClick={handlePayZero} className="text-rose-600 font-bold hover:underline">
                      Deyn
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amountPaid}
                  placeholder={`$${totalAmount.toFixed(2)}`}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Reference for mobile/bank */}
            {paymentMethod !== 'CASH' && (
              <input
                type="text"
                placeholder="Lambarka Tixraaca EVC Plus (Trx ID)"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Iibka waa la xaqiijinayaa...' : 'Dhammee Iibka & Daabac Rasiidka'}
            <ArrowRight size={15} />
          </button>
        </form>
      </div>

      {/* Thermal Receipt Print Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            {/* Printable Area */}
            <div id="printable-receipt" className="font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-base tracking-wider">DUKAAN SHOP</h3>
                <p className="text-[11px] text-slate-500">Rasiidka Rasmiga ah ee Iibka</p>
                <p className="text-[10px] text-slate-400 mt-1">Biilka #: {completedSale.saleNumber}</p>
                <p className="text-[10px] text-slate-400">{new Date(completedSale.saleDate).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[11px]"><span className="text-slate-500">Macaamilka:</span> {completedSale.customerName}</p>
                <p className="text-[11px]"><span className="text-slate-500">Xaaladda:</span> {completedSale.paymentStatus === 'PAID' ? 'WAA LA WADA BIXIYAY' : completedSale.paymentStatus === 'PARTIALLY_PAID' ? 'QEYB BAXDAY' : 'DEYN'}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {completedSale.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span>
                      {it.quantity} {it.unit} x {it.productName}
                    </span>
                    <span className="font-bold">${(it.lineTotalCents / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-extrabold text-xs">
                  <span>WADARTA GUUD:</span>
                  <span>${(completedSale.totalAmountCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LACAGTA LA BIXIYAY:</span>
                  <span>${(completedSale.amountPaidCents / 100).toFixed(2)}</span>
                </div>
                {completedSale.outstandingBalanceCents > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>DEYNTA KU MAQAN:</span>
                    <span>${(completedSale.outstandingBalanceCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                Waad ku mahadsan tahay ganacsigaaga!
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer size={15} /> Daabac Rasiidka
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Iib Cusub Bilaab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

