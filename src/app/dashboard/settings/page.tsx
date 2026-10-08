'use client';

import React, { useState } from 'react';
import { Settings, Shield, Key, Bell, Database, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-500" />
            System Settings
          </h1>
          <p className="text-gray-500 text-base font-medium">Manage Roxten OS global configurations and security.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div onClick={() => setSelectedSetting('Organization')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Organization</h3>
            <p className="text-gray-500 font-medium">Manage team members, roles, and global permissions.</p>
          </motion.div>

          <motion.div onClick={() => setSelectedSetting('Security')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
              <Shield className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Security</h3>
            <p className="text-gray-500 font-medium">Configure MFA, IP whitelists, and access logs.</p>
          </motion.div>

          <motion.div onClick={() => setSelectedSetting('API Keys')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
              <Key className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">API Keys</h3>
            <p className="text-gray-500 font-medium">Manage LLM providers and integration keys.</p>
          </motion.div>

          <motion.div onClick={() => setSelectedSetting('Notifications')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-6 group-hover:bg-rose-100 transition-colors">
              <Bell className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-500 font-medium">Configure email, slack, and push alerts.</p>
          </motion.div>

          <motion.div onClick={() => setSelectedSetting('Data Management')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <Database className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Data Management</h3>
            <p className="text-gray-500 font-medium">Export data, manage vector storage, and clear caches.</p>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSetting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4" 
            onClick={() => setSelectedSetting(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white border border-gray-200 rounded-3xl p-10 max-w-lg w-full shadow-2xl relative" 
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedSetting}</h2>
              <p className="text-gray-600 font-medium leading-relaxed mb-8">
                {selectedSetting === 'API Keys' 
                  ? 'LLM Provider configurations (such as GROQ_API_KEY) are currently managed securely via backend environment variables (.env) to prevent client-side exposure.'
                  : 'This module is governed by autonomous system policies and backend configuration files for the v1.0 release.'}
              </p>
              <button 
                onClick={() => setSelectedSetting(null)}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-bold transition-all shadow-sm"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
