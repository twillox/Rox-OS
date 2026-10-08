'use client';

import React, { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Pause, Settings, Webhook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutomationPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/automation')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIntegrations(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading Integrations...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Workflow className="w-8 h-8 text-teal-500" />
            Integrations & Automations
          </h1>
          <p className="text-gray-500 text-lg">Connect external tools and configure autonomous workflows.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-gray-900 rounded-xl transition-colors font-medium">
          <Plus className="w-4 h-4" />
          New Integration
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        <AnimatePresence>
          {integrations.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-gray-100 border-dashed rounded-3xl bg-white">
              <Webhook className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Integrations Connected</h3>
              <p className="text-gray-500">Connect Slack, Stripe, Twitter, or webhooks to empower your AI workforce.</p>
            </div>
          ) : (
            integrations.map((intg, idx) => (
              <motion.div 
                key={intg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:border-white/20 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center">
                      <Webhook className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 capitalize">{intg.provider}</h3>
                      <p className="text-sm text-teal-400">Connected</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Added {new Date(intg.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white hover:bg-gray-50 rounded-lg text-gray-600 transition-colors">
                      <Pause className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-400 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
