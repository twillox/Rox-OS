'use client';

import React, { useEffect, useState } from 'react';
import { Activity, X, Users, CheckCircle, BrainCircuit, PlayCircle, PauseCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LivePulseWidget() {
  const [pulse, setPulse] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchPulse = async () => {
      try {
        const res = await fetch('/api/os/pulse?t=' + Date.now());
        const data = await res.json();
        if (data.success && data.pulse) {
          setPulse(data.pulse);
          if (!isOpen) {
            setHasNewPulse(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch pulse:', e);
      }
    };

    fetchPulse();
    interval = setInterval(fetchPulse, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNewPulse(false);
    }
  }, [isOpen]);

  if (!pulse) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center z-40 transition-transform hover:scale-110 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Activity className="w-6 h-6 animate-pulse" />
        {hasNewPulse && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </motion.button>

      {/* Expanded Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[400px] bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Live Company Pulse
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 grid grid-cols-2 gap-3 bg-gray-50/50">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4" /> Deployed Agents
                </div>
                <div className="font-bold text-2xl text-gray-900">{pulse.activeEmployees || 0}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-2">
                  <Activity className="w-4 h-4" /> Running Tasks
                </div>
                <div className="font-bold text-2xl text-indigo-600">{pulse.tasksCount || 0}</div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-2">
                  <PlayCircle className="w-4 h-4 text-emerald-500" /> Working
                </div>
                <div className="font-bold text-xl text-emerald-600">{pulse.workingEmployees || 0}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mb-2">
                  <PauseCircle className="w-4 h-4 text-amber-500" /> Idle
                </div>
                <div className="font-bold text-xl text-amber-600">{pulse.idleEmployees || 0}</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col col-span-2">
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Avg Runtime Health
                    </div>
                    <div className="font-bold text-lg text-gray-900">100%</div>
                  </div>
                  <div className="w-px h-8 bg-gray-100 mx-4"></div>
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> Knowledge Confidence
                    </div>
                    <div className="font-bold text-lg text-emerald-500">95%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar space-y-3 bg-white">
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3 flex items-center justify-between">
                <span>Autonomous Activity Stream</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              
              {pulse.recentActivities?.map((act: any) => (
                <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 text-xs">{act.actor}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-xs">
                    {act.content}
                  </p>
                </motion.div>
              ))}
              
              {!pulse.recentActivities?.length && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 font-medium">No recent autonomous activity...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
