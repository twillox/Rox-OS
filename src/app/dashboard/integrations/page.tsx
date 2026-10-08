'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Plus, CheckCircle, AlertCircle, Loader2, Workflow, ArrowRight, Settings2, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { MOCK_INTEGRATIONS, Integration, ConnectionStatus, IntegrationCategory } from '@/lib/mock/integrations/data';

export default function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus | 'All'>('All');
  
  // Modal State
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectionStep, setConnectionStep] = useState<0|1|2|3|4|5>(0); // 0=closed, 1=prep, 2=perms, 3=oauth, 4=sync, 5=success

  useEffect(() => {
    // Load state from local storage or use defaults
    const saved = localStorage.getItem('roxten_integrations');
    if (saved) {
      setIntegrations(JSON.parse(saved));
    } else {
      setIntegrations(MOCK_INTEGRATIONS);
    }
  }, []);

  const saveIntegrations = (newIntegrations: Integration[]) => {
    setIntegrations(newIntegrations);
    localStorage.setItem('roxten_integrations', JSON.stringify(newIntegrations));
  };

  const handleConnectClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConnectionStep(1);
    
    // Step 1: Preparing Integration
    setTimeout(() => setConnectionStep(2), 1500);
    // Step 2: Checking Permissions
    setTimeout(() => setConnectionStep(3), 3000);
    // Step 3 waits for user to click Approve
  };

  const handleOAuthApprove = () => {
    setConnectionStep(4); // Sync
    setTimeout(() => {
      setConnectionStep(5); // Success
      
      // Update local storage
      const updated = integrations.map(i => 
        i.id === selectedIntegration?.id 
          ? { ...i, status: 'Connected' as ConnectionStatus, lastActivity: 'Just now' }
          : i
      );
      saveIntegrations(updated);
    }, 2500);
  };

  const categories = ['All', ...Array.from(new Set(MOCK_INTEGRATIONS.map(i => i.category)))];
  const statuses = ['All', 'Connected', 'Disconnected', 'Coming Soon', 'Syncing', 'Error'];

  const filteredIntegrations = integrations.filter(i => {
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeCategory !== 'All' && i.category !== activeCategory) return false;
    if (statusFilter !== 'All' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#fbfbfe] overflow-hidden text-gray-900 font-sans">
      {/* Prototype Banner */}
      <div className="bg-indigo-600/10 border-b border-indigo-200 p-3 flex items-center justify-center gap-3 shrink-0">
        <Zap className="w-4 h-4 text-indigo-600" />
        <p className="text-sm font-medium text-indigo-900">
          <strong className="font-bold">Prototype Mode:</strong> This module demonstrates complete integration workflows using simulated services. The architecture is production-ready.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Integrations Hub</h1>
              <p className="text-lg text-gray-500">Connect Roxten OS to your favorite tools and let AI orchestrate your workflows.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/integrations/analytics" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                <Workflow className="w-4 h-4" /> Analytics
              </Link>
              <button 
                onClick={() => alert('Custom Webhooks & REST API Connectors are available in the Enterprise Tier. Upgrade to connect proprietary internal systems.')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Custom
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex items-center gap-2 px-2 overflow-x-auto w-full md:w-auto custom-scrollbar">
              <Filter className="w-4 h-4 text-gray-400 shrink-0 mx-2" />
              <select 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value as any)}
                className="bg-gray-50 border-none text-sm font-medium rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-gray-50 border-none text-sm font-medium rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredIntegrations.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No integrations found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredIntegrations.map((integration, index) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
                >
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Demo Ready</span>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {integration.logoUrl ? (
                        <img src={integration.logoUrl} alt={integration.name} className="w-7 h-7 object-contain" />
                      ) : (
                        <Workflow className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{integration.name}</h3>
                  <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2">{integration.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {integration.status === 'Connected' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />}
                      {integration.status === 'Disconnected' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      {integration.status === 'Coming Soon' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      {integration.status === 'Syncing' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />}
                      {integration.status === 'Error' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                      <span className={`text-xs font-bold uppercase tracking-wide
                        ${integration.status === 'Connected' ? 'text-emerald-700' : ''}
                        ${integration.status === 'Disconnected' ? 'text-gray-500' : ''}
                        ${integration.status === 'Coming Soon' ? 'text-blue-600' : ''}
                        ${integration.status === 'Syncing' ? 'text-amber-600' : ''}
                        ${integration.status === 'Error' ? 'text-red-600' : ''}
                      `}>
                        {integration.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {integration.status === 'Connected' ? (
                        <>
                          <Link 
                            href={`/dashboard/integrations/${integration.id}/settings`}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Settings2 className="w-4 h-4" />
                          </Link>
                          <Link 
                            href={`/dashboard/integrations/${integration.id}`}
                            className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition flex items-center gap-1"
                          >
                            Open <ArrowRight className="w-3 h-3" />
                          </Link>
                        </>
                      ) : integration.status === 'Coming Soon' ? (
                         <button disabled className="px-4 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">
                          Soon
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConnectClick(integration)}
                          className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 hover:text-indigo-800 transition"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection Modal Overlay */}
      <AnimatePresence>
        {connectionStep > 0 && selectedIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 flex flex-col items-center text-center relative">
                {connectionStep !== 5 && (
                  <button 
                    onClick={() => setConnectionStep(0)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
                  >
                    ×
                  </button>
                )}

                {/* Shared Header Icons */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-white text-xl">R</span>
                  </div>
                  
                  {connectionStep < 4 ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse delay-150" />
                    </div>
                  ) : connectionStep === 5 ? (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                  )}

                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-lg p-3">
                    {selectedIntegration.logoUrl ? (
                      <img src={selectedIntegration.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Workflow className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Step 1 & 2: Loading State */}
                {(connectionStep === 1 || connectionStep === 2) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {connectionStep === 1 ? 'Preparing Integration...' : 'Checking Permissions...'}
                    </h2>
                    <p className="text-sm text-gray-500">Establishing secure connection to {selectedIntegration.name}</p>
                    <div className="w-full max-w-[200px] h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: connectionStep === 1 ? "40%" : "80%" }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Fake OAuth */}
                {connectionStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full text-left">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Connect {selectedIntegration.name}</h2>
                    <p className="text-sm text-gray-500 text-center mb-6">Roxten OS is requesting access to your account.</p>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Requested Permissions</p>
                      <ul className="space-y-3">
                        {selectedIntegration.scopes.length > 0 ? selectedIntegration.scopes.map(s => (
                          <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        )) : (
                          <li className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Full read/write access to workspace</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        JD
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">John Doe</p>
                        <p className="text-xs text-gray-500">john.doe@acmelogistics.com</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConnectionStep(0)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleOAuthApprove}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                      >
                        Approve Access
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Syncing */}
                {connectionStep === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Syncing Data...</h2>
                    <p className="text-sm text-gray-500">Importing initial datasets from {selectedIntegration.name}</p>
                    <div className="w-full max-w-[200px] h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden relative">
                      <motion.div 
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="h-full w-1/2 bg-indigo-600 rounded-full absolute"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Success */}
                {connectionStep === 5 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h2>
                    <p className="text-sm text-gray-500 mb-8">{selectedIntegration.name} is now fully integrated with Roxten OS.</p>
                    
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setConnectionStep(0)}
                        className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition"
                      >
                        Done
                      </button>
                      <Link 
                        href={`/dashboard/integrations/${selectedIntegration.id}`}
                        onClick={() => setConnectionStep(0)}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                      >
                        Launch App <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
