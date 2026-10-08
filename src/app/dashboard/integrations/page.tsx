'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Plus, CheckCircle, AlertCircle, Loader2, Workflow, ArrowRight, Settings2, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { MOCK_INTEGRATIONS, Integration, ConnectionStatus, IntegrationCategory } from '@/lib/mock/integrations/data';

const OAUTH_SUPPORTED_PROVIDERS = new Set([
  'gmail',
  'google-calendar',
  'google-drive',
  'github',
  'slack',
  'notion',
  'linkedin'
]);

function IntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus | 'All'>('All');
  
  // Notification / Alert banners
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  // Load real backend statuses
  const loadLiveStatuses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load status');
      const data = await res.json();
      const liveStatuses: Record<string, any> = data.integrations || {};

      setIntegrations(prev => {
        return MOCK_INTEGRATIONS.map(item => {
          const live = liveStatuses[item.id];
          if (live && live.status === 'Connected') {
            return {
              ...item,
              status: 'Connected' as ConnectionStatus,
              lastActivity: live.providerAccountName ? `Account: ${live.providerAccountName}` : 'Connected',
            };
          } else if (live && live.status === 'Error') {
            return {
              ...item,
              status: 'Error' as ConnectionStatus,
              lastActivity: 'Authentication expired',
            };
          } else {
            // Priority integrations default to Disconnected; others keep their preset
            return {
              ...item,
              status: item.status === 'Coming Soon' ? 'Coming Soon' : 'Disconnected',
              lastActivity: undefined,
            };
          }
        });
      });
    } catch (err) {
      console.error('Error fetching integration statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStatuses();

    // Check query params for OAuth result
    const connectedParam = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connectedParam) {
      const matched = MOCK_INTEGRATIONS.find(i => i.id === connectedParam);
      const name = matched ? matched.name : connectedParam;
      setAlertInfo({
        type: 'success',
        message: `Successfully connected ${name}! Credentials securely stored with AES-256 encryption.`,
      });
    } else if (errorParam) {
      setAlertInfo({
        type: 'error',
        message: errorParam,
      });
    }
  }, [searchParams]);

  const handleConnectClick = (integration: Integration) => {
    if (OAUTH_SUPPORTED_PROVIDERS.has(integration.id)) {
      // Redirect to real OAuth flow
      window.location.href = `/api/integrations/${integration.id}/connect`;
    } else {
      setAlertInfo({
        type: 'info',
        message: `${integration.name} integration is coming soon.`,
      });
    }
  };

  const handleDisconnectClick = async (integrationId: string) => {
    const confirmed = window.confirm(`Are you sure you want to disconnect this integration?`);
    if (!confirmed) return;

    try {
      setDisconnectingId(integrationId);
      const res = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to disconnect');

      setAlertInfo({
        type: 'info',
        message: `Integration has been disconnected and encrypted credentials cleared.`,
      });
      await loadLiveStatuses();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.message || 'Disconnect failed',
      });
    } finally {
      setDisconnectingId(null);
    }
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
      {/* Real OAuth 2.0 Security Banner */}
      <div className="bg-emerald-600/10 border-b border-emerald-200 p-3 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-950">
            <strong className="font-bold">Production OAuth 2.0:</strong> Integrations utilize server-side OAuth with AES-256-GCM encrypted token vaults. Real token exchange and live API sync active.
          </p>
        </div>
        <button 
          onClick={loadLiveStatuses} 
          disabled={loading}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {/* Floating Alert */}
      <AnimatePresence>
        {alertInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-8 mt-4 p-4 rounded-2xl flex items-center justify-between shadow-sm border ${
              alertInfo.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : alertInfo.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {alertInfo.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
              {alertInfo.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {alertInfo.type === 'info' && <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />}
              <span className="text-sm font-medium">{alertInfo.message}</span>
            </div>
            <button 
              onClick={() => setAlertInfo(null)}
              className="p-1 hover:bg-black/5 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Integrations Hub</h1>
              <p className="text-lg text-gray-500">Connect Roxten OS to your external accounts with authenticated OAuth 2.0 pipelines.</p>
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
              {filteredIntegrations.map((integration, index) => {
                const isOAuthReady = OAUTH_SUPPORTED_PROVIDERS.has(integration.id);
                const isDisconnecting = disconnectingId === integration.id;

                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden"
                  >
                    {/* Badge */}
                    <div className="absolute top-0 right-0 p-3">
                      {integration.status === 'Connected' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                          Live Active
                        </span>
                      ) : isOAuthReady ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                          OAuth 2.0
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                          Connector
                        </span>
                      )}
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
                    <p className="text-sm text-gray-500 mb-2 flex-1 line-clamp-2">{integration.description}</p>
                    
                    {integration.lastActivity && (
                      <p className="text-xs text-emerald-600 font-medium mb-4 truncate">
                        {integration.lastActivity}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        {integration.status === 'Connected' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                        )}
                        {integration.status === 'Disconnected' && <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                        {integration.status === 'Coming Soon' && <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />}
                        {integration.status === 'Syncing' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" />}
                        {integration.status === 'Error' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
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

                      <div className="flex items-center gap-1.5">
                        {integration.status === 'Connected' ? (
                          <>
                            <Link 
                              href={`/dashboard/integrations/${integration.id}/settings`}
                              className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              title="Manage Integration"
                            >
                              <Settings2 className="w-3.5 h-3.5" /> Manage
                            </Link>
                            <button
                              onClick={() => handleDisconnectClick(integration.id)}
                              disabled={isDisconnecting}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg transition"
                            >
                              {isDisconnecting ? '...' : 'Disconnect'}
                            </button>
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
                            className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1 shadow-sm"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 font-sans">Loading Integrations...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
