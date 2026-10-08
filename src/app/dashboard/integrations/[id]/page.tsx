'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, RefreshCw, Send, Settings2, Plus, Users, LayoutDashboard, Brain, MessageSquare, FileText, Zap, ShieldCheck, GitBranch, Calendar, Folder } from 'lucide-react';
import { MOCK_INTEGRATIONS, Integration } from '@/lib/mock/integrations/data';
import Link from 'next/link';

export default function IntegrationDemoViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [liveAccount, setLiveAccount] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [demoState, setDemoState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [demoMessage, setDemoMessage] = useState('');

  useEffect(() => {
    const loadIntegration = async () => {
      const base = MOCK_INTEGRATIONS.find((i: any) => i.id === id);
      if (!base) return;

      try {
        const res = await fetch('/api/integrations/status', { cache: 'no-store' });
        if (res.ok) {
          const statusData = await res.json();
          const live = statusData.integrations?.[id];
          if (live && live.status === 'Connected') {
            setIntegration({ ...base, status: 'Connected' });
            setLiveAccount(live.providerAccountName || null);
            fetchLiveData(id);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load live status:', e);
      }

      setIntegration(base);
    };

    loadIntegration();
  }, [id]);

  const fetchLiveData = async (integrationId: string) => {
    try {
      setLoadingLive(true);
      if (integrationId === 'gmail') {
        const res = await fetch('/api/integrations/gmail/emails?max=5');
        if (res.ok) {
          const data = await res.json();
          if (data.emails?.length) setLiveData(data.emails);
        }
      } else if (integrationId === 'github') {
        const res = await fetch('/api/integrations/github/repos?per_page=10');
        if (res.ok) {
          const data = await res.json();
          if (data.repos?.length) setLiveData(data.repos);
        }
      } else if (integrationId === 'google-calendar') {
        const res = await fetch('/api/integrations/google-calendar/events?max=10');
        if (res.ok) {
          const data = await res.json();
          if (data.events?.length) setLiveData(data.events);
        }
      } else if (integrationId === 'google-drive') {
        const res = await fetch('/api/integrations/google-drive/files?pageSize=10');
        if (res.ok) {
          const data = await res.json();
          if (data.files?.length) setLiveData(data.files);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live integration data:', err);
    } finally {
      setLoadingLive(false);
    }
  };

  if (!integration) return <div className="p-8 text-gray-500 font-sans">Loading Integration Environment...</div>;

  const runDemoAction = (actionName: string, successMsg: string) => {
    setDemoState('processing');
    setTimeout(() => {
      setDemoState('success');
      setDemoMessage(successMsg);
      setTimeout(() => setDemoState('idle'), 3000);
    }, 1200);
  };

  const renderGmailView = () => {
    const isConnected = integration.status === 'Connected';
    const emailList = liveData.length > 0 ? liveData : [
      { from: 'Sarah Jenkins (Acme Logistics)', snippet: 'Urgent: Q3 Shipping Delays - please review the new schedules.', date: '10:42 AM', subject: 'Urgent: Q3 Shipping Delays', isPriority: true },
      { from: 'David Chen (Nova Healthcare)', snippet: 'Contract Renewal Docs Attached for Roxten OS executive review.', date: '09:15 AM', subject: 'Contract Renewal Docs Attached', isPriority: true },
      { from: 'Newsletter', snippet: 'Weekly Design Trends and Enterprise AI automation benchmarks.', date: 'Yesterday', subject: 'Weekly Design Trends', isPriority: false }
    ];

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Priority Inbox</h3>
            <p className="text-xs text-gray-500">
              {isConnected && liveAccount ? `Connected Account: ${liveAccount}` : 'Gmail API & AI Assistant'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Live Sync Active
              </span>
            ) : (
              <a 
                href="/api/integrations/gmail/connect"
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
              >
                Connect Real Gmail
              </a>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {emailList.map((email: any, i: number) => (
            <div key={email.id || i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-900 text-sm">{email.from || email.sender}</span>
                <span className="text-xs text-gray-400">{email.date || email.time}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">{email.subject}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{email.snippet}</p>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => runDemoAction('Generate Reply', 'AI Reply Generated & Ready in Roxten Workflow.')}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition"
                >
                  <Brain className="w-3.5 h-3.5" /> Auto-Reply with AI
                </button>
                <button 
                  onClick={() => runDemoAction('Summarize', 'Email Summarized and indexed into Company Brain.')}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Add to Brain
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGitHubView = () => {
    const isConnected = integration.status === 'Connected';
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">GitHub Repositories</h3>
            <p className="text-xs text-gray-500">
              {isConnected && liveAccount ? `Connected User: @${liveAccount}` : 'Code Sync & Webhook Intelligence'}
            </p>
          </div>
          {isConnected ? (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Authenticated
            </span>
          ) : (
            <a 
              href="/api/integrations/github/connect"
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
            >
              Connect GitHub
            </a>
          )}
        </div>

        {liveData.length > 0 ? (
          <div className="space-y-3">
            {liveData.map((repo: any) => (
              <div key={repo.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-gray-900 text-sm">{repo.full_name}</span>
                    {repo.private && <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">Private</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{repo.description || 'No description provided'}</p>
                </div>
                <a 
                  href={repo.html_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50"
                >
                  View Repo
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <GitBranch className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Connect GitHub to monitor commits, pull requests, and automated code review workflows.</p>
          </div>
        )}
      </div>
    );
  };

  const renderGenericView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl w-full text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
        {integration.logoUrl ? (
          <img src={integration.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
        ) : (
          <LayoutDashboard className="w-10 h-10 text-gray-400" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{integration.name} Workspace</h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Status: <span className="font-bold text-gray-900">{integration.status}</span>
        {liveAccount && ` • Account: ${liveAccount}`}
      </p>
      
      {integration.status === 'Connected' ? (
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => runDemoAction('Sync', `${integration.name} Synchronized! Mission Control Updated.`)} 
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Sync Now
          </button>
          <button 
            onClick={() => runDemoAction('Workflow', 'AI Orchestration Pipeline Dispatched!')} 
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4" /> Trigger AI Action
          </button>
        </div>
      ) : (
        <a 
          href={`/api/integrations/${integration.id}/connect`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" /> Connect with OAuth 2.0
        </a>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#fbfbfe] overflow-hidden text-gray-900 font-sans relative">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {integration.logoUrl && <img src={integration.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />}
            <span className="font-bold text-gray-900">
              {integration.name} <span className="font-normal text-gray-400 ml-1">Workspace</span>
            </span>
          </div>
        </div>

        <Link href={`/dashboard/integrations/${id}/settings`} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Settings
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex items-center justify-center relative">
        {id === 'gmail' 
          ? renderGmailView() 
          : id === 'github' 
          ? renderGitHubView() 
          : renderGenericView()}

        {/* Action Toast */}
        {demoState !== 'idle' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`px-6 py-3 rounded-full flex items-center gap-3 shadow-lg border ${demoState === 'processing' ? 'bg-white border-gray-200 text-gray-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {demoState === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm font-bold">{demoState === 'processing' ? 'Executing API operation...' : demoMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
