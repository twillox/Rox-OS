'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, X, FileText } from 'lucide-react';

export function OvernightSummary() {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch the real summary from the AI API
    fetch('/api/os/brain/briefing')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.summary) {
          setSummary(data.summary);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (!isVisible || loading || error || !summary) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 backdrop-blur-sm px-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#FAFAFA] border border-gray-200 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-900/20 to-transparent flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Sunrise className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Briefing</h2>
                  <p className="text-gray-500 text-sm">Synthesized from live company activity logs.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsVisible(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
              >
                Enter Headquarters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
