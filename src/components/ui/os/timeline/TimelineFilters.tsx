import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface TimelineFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
}

export function TimelineFilters({ filters, setFilters }: TimelineFiltersProps) {
  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({ module: '', severity: '', search: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const modules = ['AUTH', 'WORKFORCE', 'TASKS', 'KNOWLEDGE', 'REPORTS', 'BOARDROOM', 'VOICE', 'MARKETING', 'AUTOMATION', 'SYSTEM', 'GAMIFICATION'];
  const severities = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-gray-500 border-r border-gray-200 pr-4 shrink-0">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search timeline..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      <select 
        value={filters.module} 
        onChange={(e) => handleChange('module', e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500"
      >
        <option value="">All Modules</option>
        {modules.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select 
        value={filters.severity} 
        onChange={(e) => handleChange('severity', e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-500"
      >
        <option value="">All Severities</option>
        {severities.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <AnimatePresence>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
