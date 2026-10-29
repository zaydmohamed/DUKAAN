import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Package,
} from 'lucide-react';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('daily-sales');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reportCatalog = [
    { id: 'daily-sales', name: '1. Iibka Maalinlaha ah', category: 'Iibka & Dakhliga' },
    { id: 'weekly-sales', name: '2. Iibka Todobaadlaha ah', category: 'Iibka & Dakhliga' },
    { id: 'monthly-sales', name: '3. Iibka Bishii', category: 'Iibka & Dakhliga' },
    { id: 'annual-sales', name: '4. Iibka Sanadlaha ah', category: 'Iibka & Dakhliga' },
    { id: 'cash-flow', name: '5. Socodka Lacagta Caddaanka ah', category: 'Caddaan & Khasnad' },
    { id: 'cash-sessions', name: '6. Xisaab-xirka Khasnadda (Sessions)', category: 'Caddaan & Khasnad' },
    { id: 'customer-debts', name: '7. Warbixinta Daymaha Macaamiisha', category: 'Daymaha & Qaamaha' },
    { id: 'debt-aging', name: '8. Cimriga Daymaha (0-90+ Maalmood)', category: 'Daymaha & Qaamaha' },
    { id: 'supplier-debts', name: '9. Daymaha Shirkadaha & Ganacsatada', category: 'Shirkadaha & Bixinta' },
    { id: 'inventory-movements', name: '10. Dhaqdhaqaaqa Bakhaarka', category: 'Bakhaarka' },
    { id: 'stock-valuation', name: '11. Qiimaha Raasamaalka Bakhaarka', category: 'Bakhaarka' },
    { id: 'low-stock', name: '12. Alaabta Dhammaanaysa & Soo Dalbasho', category: 'Bakhaarka' },
    { id: 'damaged-goods', name: '13. Alaabta Qasaartay & Kuwa Luntay', category: 'Bakhaarka' },
    { id: 'expenses', name: '14. Warbixinta Kharashaadka Shaqada', category: 'Xisaabaadka' },
    { id: 'gross-profit', name: '15. Falanqaynta Faa\'iidada Guud', category: 'Xisaabaadka' },
    { id: 'net-profit-loss', name: '16. Faa\'iidada Saafiga ah (P&L)', category: 'Xisaabaadka' },
    { id: 'payment-methods', name: '17. Qaababka Lacag-bixinta', category: 'Caddaan & Khasnad' },
    { id: 'customer-statements', name: '18. Qoraalka Xisaabta Macmiilka', category: 'Daymaha & Qaamaha' },
    { id: 'supplier-statements', name: '19. Qoraalka Xisaabta Shirkadda', category: 'Shirkadaha & Bixinta' },
    { id: 'sales-returns', name: '20. Alaabta La Soo Celiyay & Lacag-celinta', category: 'Iibka & Dakhliga' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${activeReport}?filter=${dateFilter}`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateFilter]);

  const handleExportCSV = () => {
    const token = localStorage.getItem('dukaan_token');
    const url = `/api/reports/${activeReport}?filter=${dateFilter}&format=csv`;

    // Download through browser
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeReport}-${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Warbixinada Ganacsiga & Xisaabaadka</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            20 warbixinood oo xisaabeed oo buuxa oo leh dhoofinta Excel/CSV iyo daabacaad rasmi ah
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download size={14} /> Dhoofso CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            <Printer size={14} /> Daabac Warbixinta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: 20 Reports Menu */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-2">
            Warbixinada Diyaar Ah (20)
          </h3>

          <div className="space-y-1 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {reportCatalog.map((rep) => {
              const isActive = activeReport === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => setActiveReport(rep.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {rep.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Report Display Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs font-semibold text-slate-700"
              >
                <option value="today">Maanta (Today)</option>
                <option value="yesterday">Shalay (Yesterday)</option>
                <option value="this_week">Todobaadkan (This Week)</option>
                <option value="this_month">Bishan (This Month)</option>
                <option value="this_year">Sanadkan (This Year)</option>
                <option value="all">Dhammaan Xogta (All)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Tirada Diiwaannada: <span className="font-bold text-slate-800">{reportData?.count || 0}</span>
            </div>
          </div>

          {/* Report Printable Content */}
          <div id="printable-receipt" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                  {reportCatalog.find((r) => r.id === activeReport)?.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Mudada: {dateFilter.replace('_', ' ')} • Taariikhda: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    {reportData?.headers?.map((h) => (
                      <th key={h} className="p-3">
                        {h.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan={reportData?.headers?.length || 4} className="p-8 text-center text-slate-400 font-sans">
                        Diyaarinaya xogta warbixinta...
                      </td>
                    </tr>
                  ) : reportData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={reportData?.headers?.length || 4} className="p-8 text-center text-slate-400 font-sans">
                        Wax xog xisaabeed ah lagama helin mudada la doortay.
                      </td>
                    </tr>
                  ) : (
                    reportData?.data?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        {reportData.headers.map((h) => (
                          <td key={h} className="p-3 text-slate-700">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

