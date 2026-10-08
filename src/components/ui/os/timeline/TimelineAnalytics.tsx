import React from 'react';
import { Activity, Zap, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface TimelineAnalyticsProps {
  events: any[];
}

export function TimelineAnalytics({ events }: TimelineAnalyticsProps) {
  const today = new Date();
  
  const eventsToday = events.filter(e => {
    const d = new Date(e.createdAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  }).length;

  const errors = events.filter(e => e.severity === 'ERROR' || e.severity === 'WARNING').length;
  
  const moduleCounts = events.reduce((acc: any, e) => {
    const mod = e.module || 'SYSTEM';
    acc[mod] = (acc[mod] || 0) + 1;
    return acc;
  }, {});
  
  const mostActiveModule = Object.keys(moduleCounts).length > 0 
    ? Object.keys(moduleCounts).reduce((a, b) => moduleCounts[a] > moduleCounts[b] ? a : b)
    : 'None';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Events Today</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{eventsToday}</div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-indigo-500 mb-2">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Most Active</span>
        </div>
        <div className="text-xl font-bold text-indigo-600 truncate">{mostActiveModule}</div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-rose-500 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Alerts/Errors</span>
        </div>
        <div className="text-2xl font-bold text-rose-600">{errors}</div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-emerald-500 mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Total Monitored</span>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{events.length}</div>
      </div>
    </div>
  );
}
