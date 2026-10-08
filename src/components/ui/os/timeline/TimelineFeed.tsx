import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Activity, AlertTriangle, CheckCircle2, Zap, Users, BookOpen, Briefcase, Mic, Target, Cpu, TrendingUp, Info } from 'lucide-react';

interface TimelineFeedProps {
  events: any[];
  onSelectEvent: (event: any) => void;
}

export function TimelineFeed({ events, onSelectEvent }: TimelineFeedProps) {
  const getEventIcon = (module: string) => {
    switch (module) {
      case 'WORKFORCE': return <Users className="w-4 h-4 text-indigo-500" />;
      case 'KNOWLEDGE': return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'TASKS': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'BOARDROOM': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'VOICE': return <Mic className="w-4 h-4 text-purple-500" />;
      case 'MARKETING': return <Target className="w-4 h-4 text-rose-500" />;
      case 'AUTOMATION': return <Cpu className="w-4 h-4 text-cyan-500" />;
      case 'GAMIFICATION': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'WARNING': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'SUCCESS': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default: return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR': return <AlertTriangle className="w-3 h-3 text-rose-600" />;
      case 'WARNING': return <AlertTriangle className="w-3 h-3 text-amber-600" />;
      case 'SUCCESS': return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      default: return <Info className="w-3 h-3 text-indigo-600" />;
    }
  };

  // Group events by date (today, yesterday, etc.)
  const groupedEvents = events.reduce((groups: any, event) => {
    const date = new Date(event.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {});

  return (
    <div className="max-w-4xl mx-auto w-full pb-32">
      <AnimatePresence>
        {Object.keys(groupedEvents).length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Events Recorded</h3>
            <p className="text-gray-500 text-sm">Waiting for the next business action...</p>
          </motion.div>
        ) : (
          Object.keys(groupedEvents).map(date => (
            <div key={date} className="mb-8 relative">
              <div className="sticky top-0 z-10 py-2 bg-[#FAFAFA]/90 backdrop-blur-md flex items-center gap-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  {date}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-4 relative before:absolute before:left-[1.35rem] before:top-2 before:bottom-0 before:w-px before:bg-gray-200">
                {groupedEvents[date].map((event: any, idx: number) => (
                  <motion.div 
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    onClick={() => onSelectEvent(event)}
                    className="flex gap-4 relative group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative z-10 shrink-0 group-hover:border-indigo-300 group-hover:scale-110 transition-all">
                      {getEventIcon(event.module || 'SYSTEM')}
                    </div>
                    
                    <div className={`flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm group-hover:shadow-md group-hover:border-indigo-200 transition-all ${event.severity === 'ERROR' ? 'border-rose-200 bg-rose-50/30' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase border shadow-sm ${getSeverityStyles(event.severity || 'INFO')}`}>
                            {event.module || 'SYSTEM'}
                          </span>
                          <span className="text-[10px] font-bold tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {event.actor || 'System'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{event.title}</h3>
                      {event.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{event.description}</p>}
                      
                      <div className="flex gap-2">
                        {event.severity && event.severity !== 'INFO' && (
                           <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${getSeverityStyles(event.severity)}`}>
                             {getSeverityIcon(event.severity)} {event.severity}
                           </div>
                        )}
                        {event.targetEntity && (
                           <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                             {event.targetEntity}
                           </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

