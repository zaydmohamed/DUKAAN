import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Search, Filter, RefreshCw, Calendar } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/audit-logs';
      if (actionFilter) url += `?action=${actionFilter}`;
      const res = await api.get(url);
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diiwaanka Ilaalada & Baaritaanka (Audit Logs)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Raad-raac maaliyadeed oo aan la tirtiri karin oo lagu kaydiyo iib kasta, lacag-qabasho, sixitaanka bakhaarka, iyo tirtirista deynta
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition self-start sm:self-auto"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">Waqtiga</th>
                <th className="p-3.5">Shaqaalaha</th>
                <th className="p-3.5">Tallaabada La Qaaday</th>
                <th className="p-3.5">Qeybta</th>
                <th className="p-3.5">Sharaxaadda</th>
                <th className="p-3.5">Sababta Rasmiga ah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Soo raraya diiwaanka baaritaanka...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Weli wax diiwaan tallaabo ah lama qorin.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {l.userName}
                      <span className="block text-[10px] font-normal text-slate-400 uppercase font-mono">{l.userRole}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{l.resourceType}</td>
                    <td className="p-3.5 text-slate-800 font-medium max-w-sm">{l.description}</td>
                    <td className="p-3.5 text-slate-500 italic">{l.reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

