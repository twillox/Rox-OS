'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, RefreshCw, Send, Settings2, Plus, Users, LayoutDashboard, Brain, MessageSquare, FileText, Zap } from 'lucide-react';
import { MOCK_INTEGRATIONS, Integration } from '@/lib/mock/integrations/data';
import Link from 'next/link';

export default function IntegrationDemoViewer() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [demoState, setDemoState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [demoMessage, setDemoMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('roxten_integrations');
    const all = saved ? JSON.parse(saved) : MOCK_INTEGRATIONS;
    const found = all.find((i: any) => i.id === id);
    if (found) setIntegration(found);
  }, [id]);

  if (!integration) return <div className="p-8">Loading Prototype Environment...</div>;

  const runDemoAction = (actionName: string, successMsg: string) => {
    setDemoState('processing');
    setTimeout(() => {
      setDemoState('success');
      setDemoMessage(successMsg);
      // Reset after 3s
      setTimeout(() => setDemoState('idle'), 3000);
    }, 1500);
  };

  const renderGmailDemo = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Priority Inbox (AI Filtered)</h3>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">2 New High Priority</span>
      </div>
      
      <div className="space-y-4">
        {[
          { from: 'Sarah Jenkins (Acme Logistics)', sub: 'Urgent: Q3 Shipping Delays', time: '10:42 AM', isPriority: true },
          { from: 'David Chen (Nova Healthcare)', sub: 'Contract Renewal Docs Attached', time: '09:15 AM', isPriority: true },
          { from: 'Newsletter', sub: 'Weekly Design Trends', time: 'Yesterday', isPriority: false }
        ].map((email, i) => (
          <div key={i} className={`p-4 rounded-xl border ${email.isPriority ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-gray-900">{email.from}</span>
              <span className="text-xs text-gray-500">{email.time}</span>
            </div>
            <p className="text-sm text-gray-700 font-medium mb-4">{email.sub}</p>
            {email.isPriority && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-indigo-100">
                <button 
                  onClick={() => runDemoAction('Generate Reply', 'AI Reply Generated & Sent! Timeline Event Published.')}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition"
                >
                  <Brain className="w-3 h-3" /> Auto-Reply with AI
                </button>
                <button 
                  onClick={() => runDemoAction('Summarize', 'Email Summarized and added to Company Brain.')}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <FileText className="w-3 h-3" /> Add to Brain
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStripeDemo = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl w-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-900">Revenue Overview</h3>
        <select className="bg-gray-50 border-none text-sm font-medium rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Gross Volume</p>
          <p className="text-2xl font-black text-gray-900">$124,500.00</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">New Customers</p>
          <p className="text-2xl font-black text-gray-900">142</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Churn Rate</p>
          <p className="text-2xl font-black text-gray-900">1.2%</p>
        </div>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-4">Recent Payments</h4>
      <div className="space-y-3">
        {[
          { name: 'Atlas Industries', amount: '$4,500.00', status: 'Succeeded' },
          { name: 'BrightEdge Tech', amount: '$1,200.00', status: 'Succeeded' },
          { name: 'Nova Healthcare', amount: '$8,900.00', status: 'Pending' }
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-500" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-900">{p.amount}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${p.status === 'Succeeded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={() => runDemoAction('Sync', 'Revenue Data Synced to Executive Reports!')} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Force Sync Analytics
        </button>
      </div>
    </div>
  );

  const renderGenericDemo = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl w-full text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
        {integration.logoUrl ? (
          <img src={integration.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
        ) : (
          <LayoutDashboard className="w-10 h-10 text-gray-400" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{integration.name} Interactive Demo</h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">This integration is active. You can simulate syncing data or running an automated AI workflow to test the event architecture.</p>
      
      <div className="flex justify-center gap-4">
        <button onClick={() => runDemoAction('Sync', 'Data Sync Complete! Mission Control Updated.')} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2 shadow-sm">
          <RefreshCw className="w-4 h-4" /> Simulate Sync
        </button>
        <button onClick={() => runDemoAction('Workflow', 'AI Workflow Executed Successfully!')} className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
          <Zap className="w-4 h-4" /> Trigger Workflow
        </button>
      </div>
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
            <span className="font-bold text-gray-900">{integration.name} <span className="font-normal text-gray-400 ml-1">Prototype Workspace</span></span>
          </div>
        </div>

        <Link href={`/dashboard/integrations/${id}/settings`} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Settings
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex items-center justify-center relative">
        {id === 'gmail' ? renderGmailDemo() : id === 'stripe' ? renderStripeDemo() : renderGenericDemo()}

        {/* Global Toast */}
        {demoState !== 'idle' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`px-6 py-3 rounded-full flex items-center gap-3 shadow-lg border ${demoState === 'processing' ? 'bg-white border-gray-200 text-gray-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {demoState === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm font-bold">{demoState === 'processing' ? 'Processing simulated action...' : demoMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
