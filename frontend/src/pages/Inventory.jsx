import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

const Inventory = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('this_month');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/inventory-movements?filter=${filter}`);
      if (res.data.success) {
        setMovements(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Dhaqdhaqaaqa Bakhaarka (Inventory Movement)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaanka cad ee alaabaha soo galay, kuwii iibka ku baxay, qasaaraha, iyo celinta
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="today">Maanta</option>
            <option value="this_week">Toddobaadkan</option>
            <option value="this_month">Bishan</option>
            <option value="all">Dhammaan Dhaqdhaqaaqyada</option>
          </select>
          <button
            onClick={fetchMovements}
            title="Cusboonaysii"
            className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Accounting Formula Card */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
        <div>
          <span className="text-indigo-400 font-bold">Sharciga Xisaabinta Bakhaarka: </span>
          <span>Kaydka Haraa = Bilowgii + Soo Iibsigii Soo Galay + Wixii Soo Noqday - Iibkii Baxay - Wixii Qasaaray/Luntay</span>
        </div>
        <span className="text-slate-400 text-[11px]">Xisaab Sugan</span>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Waqtiga</th>
                <th className="p-3.5">Alaabta</th>
                <th className="p-3.5">Nooca</th>
                <th className="p-3.5">Isbeddelka Tirada</th>
                <th className="p-3.5">Xaddigii Hore</th>
                <th className="p-3.5">Xaddiga Cusub</th>
                <th className="p-3.5">Sababta</th>
                <th className="p-3.5">Shaqaalaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Dhaqdhaqaaqa bakhaarka ayaa la soo rarayaa...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Wax dhaqdhaqaaq ah lagama helin mudadaan.</td>
                </tr>
              ) : (
                movements.map((m, idx) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(m.date).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{m.product}</div>
                        <div className="text-[10px] font-mono text-slate-400">{m.sku}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.movementType === 'PURCHASE' || m.movementType === 'OPENING'
                              ? 'bg-blue-100 text-blue-700'
                              : m.movementType === 'SALE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : m.movementType === 'DAMAGE' || m.movementType === 'LOSS'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {m.movementType === 'PURCHASE' ? 'SOO IIBSI' : m.movementType === 'SALE' ? 'IIB' : m.movementType === 'OPENING' ? 'BILOW' : m.movementType === 'DAMAGE' ? 'QASAARO' : m.movementType === 'LOSS' ? 'LUNTAY' : m.movementType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono">
                        <span className={isPositive ? 'text-blue-600' : 'text-slate-700'}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{m.stockBefore}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{m.stockAfter}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{m.reason || '-'}</td>
                      <td className="p-3.5 font-medium text-slate-600">{m.user}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;

