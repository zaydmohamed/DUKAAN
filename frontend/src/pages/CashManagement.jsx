import React, { useState, useEffect } from 'react';
import api, { formatMoney } from '../services/api';
import {
  Wallet,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  X,
  DollarSign,
  FileText,
} from 'lucide-react';

const CashManagement = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open modal state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('100.00');

  // Close modal state
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCountedCash, setActualCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [error, setError] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [currRes, histRes] = await Promise.all([
        api.get('/cash/current'),
        api.get('/cash/history'),
      ]);
      if (currRes.data.success) setCurrentSession(currRes.data.data);
      if (histRes.data.success) setHistory(histRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/cash/open', { openingCash: Number(openingCash) });
      setShowOpenModal(false);
      loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleCloseSession = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/cash/close', {
        sessionId: currentSession._id,
        actualCountedCash: Number(actualCountedCash),
        closingNotes,
        discrepancyExplanation: discrepancyReason,
      });
      setShowCloseModal(false);
      loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Expected vs counted difference in close modal
  const expectedCents = currentSession ? currentSession.expectedClosingCashCents : 0;
  const countedCents = actualCountedCash ? Math.round(Number(actualCountedCash) * 100) : 0;
  const diffCents = countedCents - expectedCents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Maamulka Khasnadda Lacagta (Cash Management)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xisaabinta lacagta caddaanka ah ee sanduuqa, furista maalinta, xiritaanka, iyo ogaanshaha farqiga
          </p>
        </div>

        <div>
          {currentSession ? (
            <button
              onClick={() => {
                setActualCountedCash((currentSession.expectedClosingCashCents / 100).toFixed(2));
                setClosingNotes('');
                setDiscrepancyReason('');
                setError('');
                setShowCloseModal(true);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition"
            >
              <CheckCircle size={16} /> Xisaabi & Xir Khasnadda
            </button>
          ) : (
            <button
              onClick={() => {
                setShowOpenModal(true);
                setError('');
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
            >
              <Wallet size={16} /> Fur Khasnad Maalinle ah
            </button>
          )}
        </div>
      </div>

      {/* Active Cash Session Details Card */}
      {currentSession ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-base text-slate-800">Khasnaddu Hadda Waa Furan Tahay</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                La furay {new Date(currentSession.openedAt).toLocaleString()}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
              KHASNADDU WAA FURAN TAHAY
            </span>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lacagtii Lagu Furay</span>
              <p className="text-xl font-extrabold text-slate-800 mt-1 font-mono">
                {formatMoney(currentSession.openingCashCents)}
              </p>
              <span className="text-[10px] text-slate-500">Lacagta subaxdii sanduuqa ku jirtay</span>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">+ Iibka Caddaanka ah</span>
              <p className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
                +{formatMoney(currentSession.cashSalesCents)}
              </p>
              <span className="text-[10px] text-emerald-600">Iibka kaashka tooska ah</span>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">+ Deyn Soo Noqotay</span>
              <p className="text-xl font-extrabold text-teal-700 mt-1 font-mono">
                +{formatMoney(currentSession.cashDebtCollectionsCents)}
              </p>
              <span className="text-[10px] text-teal-600">Daymihii macaamiisha ee caddaan la bixiyay</span>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">- Lacagaha Baxay</span>
              <p className="text-xl font-extrabold text-rose-700 mt-1 font-mono">
                -{formatMoney(currentSession.cashExpensesCents + currentSession.cashSupplierPaymentsCents)}
              </p>
              <span className="text-[10px] text-rose-600">Kharashaad & shirkadaha la siiyay</span>
            </div>

            <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">= Lacagta Laga Filayo Khasnadda</span>
              <p className="text-xl font-extrabold text-indigo-700 mt-1 font-mono">
                {formatMoney(currentSession.expectedClosingCashCents)}
              </p>
              <span className="text-[10px] text-indigo-600">Lacagta caddaanka ee sanduuqa ku jirta</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <Wallet size={36} className="text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Ma Jirto Khasnad Furan Hadda</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Fur khasnadda bilowga maalinta si aad u diiwaangeliso dhaqdhaqaaqa lacagta caddaanka ah iyo xisaab-xirka.
          </p>
          <button
            onClick={() => {
              setShowOpenModal(true);
              setError('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30"
          >
            Fur Khasnadda Maanta
          </button>
        </div>
      )}

      {/* Past Sessions History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <History size={16} className="text-slate-500" />
          <h3 className="font-bold text-slate-800 text-xs">Taariikhda Khasnadihii Hore & Farqigooda</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Waqtiga Furitaanka</th>
                <th className="p-3.5">Waqtiga Xiritaanka</th>
                <th className="p-3.5">Khasnajiga</th>
                <th className="p-3.5">Lagu Furay</th>
                <th className="p-3.5">Iibka Caddaanka</th>
                <th className="p-3.5">Laga Filayay</th>
                <th className="p-3.5">Wixii La Tiriyay</th>
                <th className="p-3.5">Farqiga (Diff)</th>
                <th className="p-3.5">Xaaladda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Weli wax taariikh ah ma jiraan.</td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(s.openedAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {s.closedAt ? new Date(s.closedAt).toLocaleString() : 'Furan'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{s.cashier?.name}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      ${(s.openingCashCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-600 font-bold">
                      ${(s.cashSalesCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ${(s.expectedClosingCashCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ${(s.actualCountedCashCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 font-mono font-extrabold">
                      <span
                        className={
                          s.differenceCents === 0
                            ? 'text-emerald-600'
                            : s.differenceCents > 0
                            ? 'text-blue-600'
                            : 'text-rose-600'
                        }
                      >
                        {s.differenceCents > 0 ? '+' : ''}${(s.differenceCents / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status === 'OPEN' ? 'FURAN' : 'XIDHAN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Fur Khasnad Maalinle ah</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleOpenSession} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Lacagta Bilowga ah ee Sanduuqa Lagu Furayo ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-indigo-600 text-base"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Fadlan tiri lacagta caddaanka ah ee sanduuqa ku jirta ka hor inta aadan furin
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Fur Khasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Reconciliation Modal */}
      {showCloseModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Xisaabi & Xir Khasnadda</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>
            )}

            <div className="my-3 p-3 bg-indigo-50 rounded-xl text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span>Lacagta Laga Filayay:</span>
                <span className="font-bold">${(expectedCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-indigo-700">
                <span>Lacagta Aad Hadda Tiriyay:</span>
                <span className="font-bold">${(countedCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-indigo-200 font-extrabold text-sm">
                <span>Farqiga (Dhimis ama Dheeraad):</span>
                <span className={diffCents === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {diffCents > 0 ? '+' : ''}${(diffCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Lacagta Caddaanka ah ee Aad Tiriyay ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 text-base"
                />
              </div>

              {diffCents !== 0 && (
                <div>
                  <label className="block font-bold text-rose-600 mb-1">
                    Sharaxaadda Farqiga (Sababta lacagtu u dhiman tahay ama u dheer tahay) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Sharax sababta lacagta la tiriyay ay ula ekaan wayday tii la filayay..."
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    className="w-full bg-rose-50/50 border border-rose-300 rounded-lg px-3 py-2 text-rose-950"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">Xusuusin / Faallada Xiritaanka</label>
                <input
                  type="text"
                  placeholder="Faallo ku saabsan wareejinta khasnadda..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/30"
                >
                  Xaqiiji & Xir Khasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;

