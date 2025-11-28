import React from 'react';
import { useStore } from '../context/StoreContext';
import { Users, Calendar, Activity, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { members, events, logs } = useStore();

  const stats = [
    { label: 'Mitglieder Gesamt', value: members.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aktive Events', value: events.length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Audit Logs', value: logs.length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Dummy data for chart
  const data = [
    { name: 'Jan', events: 4, members: 120 },
    { name: 'Feb', events: 3, members: 125 },
    { name: 'Mär', events: 5, members: 130 },
    { name: 'Apr', events: 8, members: 132 },
    { name: 'Mai', events: 6, members: 140 },
    { name: 'Jun', events: 9, members: 145 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-slate-700 mb-4">Aktivitätsübersicht</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip />
                <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-slate-700 mb-4">Letzte Änderungen</h3>
          <div className="space-y-4">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="min-w-[4px] bg-slate-200 rounded-full" />
                <div>
                  <p className="font-medium text-slate-800">{log.action}</p>
                  <p className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleTimeString()} - {log.user}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-slate-400 text-sm">Keine Aktivitäten protokolliert.</p>}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition-colors flex items-center justify-center gap-1">
            Alle Logs ansehen <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
