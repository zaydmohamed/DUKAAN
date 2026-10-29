import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, Save, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) setSettings(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');

    try {
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setSettings(res.data.data);
        setSuccessMsg('Habeynta nidaamka si guul leh ayaa loo keydiyay!');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-800">Habaynta & Siyaasadda Nidaamka</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Habee macluumaadka dukaanka, siyaasadda qiimeynta bakhaarka, iyo fariimaha rasiidhka
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 text-xs">
        {/* Business Profile */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
            Astaanta Dukaanka & Rasiidhada
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Magaca Dukaanka *</label>
              <input
                type="text"
                required
                value={settings.shopName || ''}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Hal-kudhigga Dukaanka (Tagline)</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Telefoonka</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Email-ka</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Cinwaanka Dukaanka</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Fariinta Hoose ee Rasiidhka (Mahadnaq)</label>
            <input
              type="text"
              value={settings.receiptFooterMessage || ''}
              onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium"
            />
          </div>
        </div>

        {/* Accounting Policies */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100">
            Siyaasadda Xisaabaadka & Ilaalinta Bakhaarka
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Habka Qiimeynta Bakhaarka</label>
              <select
                value={settings.costingMethod || 'WEIGHTED_AVERAGE'}
                onChange={(e) => setSettings({ ...settings, costingMethod: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
              >
                <option value="WEIGHTED_AVERAGE">Weighted-Average Costing (Heerka Caalamiga)</option>
                <option value="FIFO">FIFO (Kii Hore U Yimid Ayaa Hore U Baxaya)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Nooca & Astaanta Lacagta</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.currency || 'USD'}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-2/3 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold uppercase font-mono"
                  placeholder="USD"
                />
                <input
                  type="text"
                  value={settings.currencySymbol || '$'}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-1/3 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-center font-mono"
                  placeholder="$"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block text-xs">Ogolow in Bakhaarku Noqdo Negative (-)</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Markii la demiyo, nidaamka POS-ka iyo iibka waxay diidayaan iib kasta haddii alaabta la doonayo ay ka badan tahay inta dhabta ah ee bakhaarka ku jirta.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNegativeStock || false}
                onChange={(e) => setSettings({ ...settings, allowNegativeStock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/30 transition text-xs"
          >
            <Save size={15} />
            {saving ? 'Keydinaya...' : 'Keydi Habeynta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

