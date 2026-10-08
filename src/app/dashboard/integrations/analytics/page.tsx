'use client';

import React from 'react';
import { ArrowLeft, Workflow, Activity, CheckCircle, Clock, Zap, Database, ArrowUpRight, Brain, FileText, Calendar, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function IntegrationsAnalytics() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#fbfbfe] overflow-hidden text-gray-900 font-sans">
      <div className="bg-indigo-600/10 border-b border-indigo-200 p-3 flex items-center justify-center gap-3 shrink-0">
        <Zap className="w-4 h-4 text-indigo-600" />
        <p className="text-sm font-medium text-indigo-900">
          <strong className="font-bold">Prototype Data:</strong> This dashboard is populated with realistic demo metrics from simulated integrations.
        </p>
      </div>

      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="p-2 mr-4 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Integration Analytics</h1>
          <p className="text-xs text-gray-500">Live metrics across all connected services</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Workflow className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Active Connections</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-gray-900">12</p>
                <p className="text-sm font-bold text-emerald-500 flex items-center"><ArrowUpRight className="w-4 h-4" /> +2 this week</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">API Health</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-gray-900">99.9%</p>
                <p className="text-sm font-bold text-emerald-500">All systems operational</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Pending Syncs</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-gray-900">4</p>
                <p className="text-sm font-bold text-gray-400">Scheduled for next tick</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 mb-1">Data Processed</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-gray-900">2.4 GB</p>
                <p className="text-sm font-bold text-gray-400">This month</p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Workflows */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" /> AI Action Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Emails Auto-Replied</p>
                      <p className="text-xs text-gray-500">Via Gmail & Outlook Integrations</p>
                    </div>
                  </div>
                  <span className="font-black text-xl text-gray-900">1,248</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Meetings Scheduled</p>
                      <p className="text-xs text-gray-500">Conflict resolved via AI Agent</p>
                    </div>
                  </div>
                  <span className="font-black text-xl text-gray-900">84</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Knowledge Docs Synced</p>
                      <p className="text-xs text-gray-500">From Google Drive & Notion</p>
                    </div>
                  </div>
                  <span className="font-black text-xl text-gray-900">312</span>
                </div>
              </div>
            </div>

            {/* Sync Logs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" /> Recent Webhook Events
              </h3>

              <div className="space-y-4">
                {[
                  { title: 'New Customer Payment', source: 'Stripe', time: '2 mins ago', status: 'success' },
                  { title: 'Lead Status Updated', source: 'HubSpot', time: '14 mins ago', status: 'success' },
                  { title: 'Drive Folder Sync', source: 'Google Drive', time: '1 hour ago', status: 'success' },
                  { title: 'Pull Request Merged', source: 'GitHub', time: '3 hours ago', status: 'success' },
                  { title: 'Auth Token Refresh', source: 'Notion', time: '5 hours ago', status: 'warning' },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-gray-900">{log.title}</p>
                        <span className="text-xs text-gray-500">{log.time}</span>
                      </div>
                      <p className="text-xs font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md">{log.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
