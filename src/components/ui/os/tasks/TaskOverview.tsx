import React, { useMemo } from 'react';
import { Target, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, Activity, BatteryCharging } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskOverviewProps {
  tasks: any[];
}

export function TaskOverview({ tasks }: TaskOverviewProps) {
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = tasks.filter(t => {
      if (t.status !== 'COMPLETED') return false;
      const date = new Date(t.updatedAt || t.createdAt);
      return date >= today;
    }).length;

    const createdToday = tasks.filter(t => {
      const date = new Date(t.createdAt);
      return date >= today;
    }).length;

    const running = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'COMPLETED' || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const totalCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0;
    
    // Simple productivity score metric based on moving tasks forward
    const productivityScore = Math.min(100, Math.round((completedToday * 15) + (running * 5) - (blocked * 10)));

    return { completedToday, createdToday, running, blocked, overdue, completionRate, productivityScore, total: tasks.length };
  }, [tasks]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {/* Velocity / Productivity */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-indigo-600">
            <BatteryCharging className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Productivity</span>
          </div>
          {metrics.productivityScore >= 50 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          )}
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">{metrics.productivityScore}</div>
          <div className="text-xs font-semibold text-gray-400">score</div>
        </div>
      </motion.div>

      {/* Completion Rate */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-emerald-600">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Completion</span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
        </div>
        <div className="flex items-baseline gap-2 relative z-10">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">{metrics.completionRate}%</div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/20 w-full">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${metrics.completionRate}%` }}
             transition={{ duration: 1, delay: 0.2 }}
             className="h-full bg-emerald-500"
           />
        </div>
      </motion.div>

      {/* Today's Changes */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-blue-600">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Today</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
            <span>Completed</span>
            <span className="text-emerald-600">+{metrics.completedToday}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
            <span>Created</span>
            <span className="text-blue-600">+{metrics.createdToday}</span>
          </div>
        </div>
      </motion.div>

      {/* Running */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Running</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight relative z-10">{metrics.running}</div>
      </motion.div>

      {/* Blocked / Overdue */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="bg-white/60 backdrop-blur-xl border border-rose-500/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Needs Attention</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
            <span>Blocked</span>
            <span className="text-rose-600">{metrics.blocked}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-gray-700">
            <span>Overdue</span>
            <span className="text-amber-600">{metrics.overdue}</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
