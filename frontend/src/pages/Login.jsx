import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Shield, User, Key, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/40 text-white font-extrabold text-2xl">
            D
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">DUKAAN Enterprise</h2>
          <p className="text-sm text-slate-400 mt-1">
            Nidaamka Maamulka Dukaanka & Xisaabaadka POS
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Magaca Isticmaalaha ama Email-ka
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tusaale: admin"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Furaha Sirta ah (Password)
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm"
          >
            {loading ? 'Gudaha loo galayaa...' : 'Gal Nidaamka (Sign In)'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <p className="text-xs text-slate-400 font-semibold text-center mb-3">
            Geli Akoonnada Tusaalaha ah:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'Password123!')}
              className="px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-indigo-300 transition text-center"
            >
              Maamule (Admin)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'Password123!')}
              className="px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-emerald-300 transition text-center"
            >
              Khasnaji (Cashier)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('stock', 'Password123!')}
              className="px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-amber-300 transition text-center"
            >
              Bakhaarka (Stock)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

