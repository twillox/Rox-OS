import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Activity, AlertTriangle, CheckCircle2, Info, Hash, Braces, User } from 'lucide-react';

interface TimelineDetailsPanelProps {
  event: any | null;
  onClose: () => void;
}

export function TimelineDetailsPanel({ event, onClose }: TimelineDetailsPanelProps) {
  if (!event) return null;

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
      case 'ERROR': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default: return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                  {event.module || 'SYSTEM'}
                </span>
                {event.severity && (
                   <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase border shadow-sm ${getSeverityStyles(event.severity)}`}>
                     {event.severity}
                   </span>
                )}
                <span className="text-[10px] font-bold tracking-widest text-gray-400">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                {event.severity && getSeverityIcon(event.severity)} {event.title}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            
            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> Event Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
                {event.description}
              </p>
            </div>

            {/* Core Metadata */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Properties
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{new Date(event.createdAt).toLocaleDateString()}</div>
                </div>
                
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Actor</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{event.actor || 'System'}</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Event Type</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{event.type}</div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Target</div>
                  <div className="text-sm font-bold text-gray-900 truncate">{event.targetEntity || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Advanced Metadata (JSON Payload) */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Braces className="w-4 h-4" /> Payload Metadata
                </h3>
                <div className="bg-[#1E1E1E] rounded-xl border border-gray-800 p-4 overflow-x-auto custom-scrollbar">
                  <pre className="text-xs text-emerald-400 font-mono">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* ID Tracking */}
            <div className="pt-6 border-t border-gray-100">
               <div className="text-[10px] text-gray-400 font-mono flex flex-col gap-1">
                 <span>ID: {event.id}</span>
                 {event.relatedEntityId && <span>Related Entity: {event.relatedEntityId}</span>}
                 {event.relatedEmployeeId && <span>Related Employee: {event.relatedEmployeeId}</span>}
               </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
