import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { formatMoney } from '../services/api';
import {
  Users,
  Printer,
  CreditCard,
  Receipt,
  DollarSign,
  ArrowLeft,
  Calendar,
  CheckCircle,
} from 'lucide-react';

const CustomerDetails = () => {
  const { id } = useParams();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}/statement`);
      if (res.data.success) {
        setStatement(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !statement) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { customer, sales, payments, creditNotes, reconciledBalanceCents } = statement;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Ku Noqo Macaamiisha
        </button>

        <div className="flex gap-2">
          {reconciledBalanceCents > 0 && (
            <button
              onClick={() => navigate(`/payments?customerId=${customer._id}`)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Qabo Lacag
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer size={15} /> Daabac Bayaanka (Statement)
          </button>
        </div>
      </div>

      {/* Customer Statement Viewport / Printable */}
      <div id="printable-receipt" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">BAYAANKA XISAABTA EE MACMIILKA</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">DUKAAN Nidaamka Maamulka Dukaanka & Xisaabaadka</p>
          </div>
          <div className="sm:text-right font-mono text-xs text-slate-500">
            <div>Taariikhda La Daabacay: {new Date().toLocaleDateString()}</div>
            <div>Xaaladda Akoonka: <span className="font-bold text-slate-800 uppercase">{customer.status === 'ACTIVE' ? 'SHAQEYNAYA' : customer.status}</span></div>
          </div>
        </div>

        {/* Customer Card & Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Xogta Macmiilka
            </span>
            <h4 className="font-extrabold text-base text-slate-900">{customer.name}</h4>
            <p className="text-slate-600 mt-1">Telefoon: {customer.phone || 'Ma jiro'}</p>
            <p className="text-slate-600">Email: {customer.email || 'Ma jiro'}</p>
            <p className="text-slate-600">Cinwaanka: {customer.address || 'Ma jiro'}</p>
          </div>

          <div className="sm:text-right flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Wadarta Deynta Lagu Leeyahay
            </span>
            <div>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">
                ${(reconciledBalanceCents / 100).toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                Deyntii Hore (Opening Balance): ${(customer.openingBalanceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Receipt size={16} className="text-indigo-600" /> Taariikhda Qaansheekooyinka Iibka
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">Qaansheeko #</th>
                  <th className="p-3">Taariikhda</th>
                  <th className="p-3">Wadarta Guud</th>
                  <th className="p-3">Lacagta Baxday</th>
                  <th className="p-3">Deynta Harsan</th>
                  <th className="p-3">Xaaladda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">Ma jirto qaansheeko loo qoray macmiilkan.</td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{s.saleNumber}</td>
                      <td className="p-3 text-slate-500 font-mono">{new Date(s.saleDate).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold">${(s.totalAmountCents / 100).toFixed(2)}</td>
                      <td className="p-3 font-mono text-emerald-600">${(s.amountPaidCents / 100).toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">
                        ${(s.outstandingBalanceCents / 100).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.paymentStatus === 'PAID' ? 'WAA LA BIXIYAY' : s.paymentStatus === 'PARTIALLY_PAID' ? 'QEYB BAXDAY' : 'DEYN'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments History */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" /> Diiwaanka Lacagaha La Qabtay
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">Rasiidh #</th>
                  <th className="p-3">Taariikhda</th>
                  <th className="p-3">Habka Lacagta</th>
                  <th className="p-3">Tixraaca</th>
                  <th className="p-3">Lacagta La Bixiyay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">Weli wax lacag ah kama soo xeroon macmiilkan.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="p-3 text-slate-500 font-mono">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-700">{p.paymentMethod}</td>
                      <td className="p-3 text-slate-500 font-mono">{p.referenceNumber || '-'}</td>
                      <td className="p-3 font-mono font-extrabold text-emerald-600">
                        ${(p.amountCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-slate-400 text-xs">
          Bayaankan waxaa si rasmi ah u soo saaray nidaamka xisaabaadka ee DUKAAN.
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;

