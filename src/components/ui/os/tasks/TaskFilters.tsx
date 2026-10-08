import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  departments?: any[];
  employees?: any[];
}

export function TaskFilters({ filters, setFilters, departments = [], employees = [] }: TaskFiltersProps) {
  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({ search: '', departmentId: '', employeeId: '', status: '', priority: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const selectClasses = "px-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all backdrop-blur-sm cursor-pointer shadow-sm hover:bg-white/80 hover:shadow";

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-4 shadow-sm mb-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-gray-500 border-r border-gray-200/50 pr-4 shrink-0">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
      </div>

      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search task titles..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm backdrop-blur-sm placeholder-gray-400"
        />
      </div>

      <select 
        value={filters.departmentId} 
        onChange={(e) => handleChange('departmentId', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Departments</option>
        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      <select 
        value={filters.employeeId} 
        onChange={(e) => handleChange('employeeId', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Employees</option>
        {employees
          .filter(e => !filters.departmentId || e.departmentId === filters.departmentId)
          .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
        }
      </select>

      <select 
        value={filters.priority} 
        onChange={(e) => handleChange('priority', e.target.value)}
        className={selectClasses}
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
