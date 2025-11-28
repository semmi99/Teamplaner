import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Shield, User, Lock, ArrowRight } from 'lucide-react';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('EDITOR');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) login(email, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-brand-600 p-8 text-center text-white">
          <Shield size={48} className="mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold">PlanMaster Pro</h1>
          <p className="text-brand-100 mt-2">Sichere Veranstaltungsplanung</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail Adresse</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="name@firma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="••••••••"
                defaultValue="password" // Mock password
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <a href="#" className="text-brand-600 hover:underline">Passwort vergessen?</a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Simulierte Rolle (für Demo)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ADMIN', 'EDITOR', 'VIEWER'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-1 rounded-md text-xs font-semibold border transition-all ${
                    role === r 
                      ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {role === 'ADMIN' && 'Vollzugriff auf Einstellungen & Mitglieder.'}
              {role === 'EDITOR' && 'Kann Veranstaltungen planen, aber keine Mitglieder löschen.'}
              {role === 'VIEWER' && 'Nur Lesezugriff & PDF Export.'}
            </p>
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <span>Anmelden</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
