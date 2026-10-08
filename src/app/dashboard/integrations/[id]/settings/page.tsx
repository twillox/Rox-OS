'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Server, Shield, Activity, PowerOff, Zap, CheckCircle } from 'lucide-react';
import { MOCK_INTEGRATIONS, Integration } from '@/lib/mock/integrations/data';

export default function IntegrationSettings() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [syncFreq, setSyncFreq] = useState('realtime');
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('roxten_integrations');
    const all = saved ? JSON.parse(saved) : MOCK_INTEGRATIONS;
    const found = all.find((i: any) => i.id === id);
    if (found) setIntegration(found);
  }, [id]);

  const handleDisconnect = () => {
    if (!integration) return;
    const saved = localStorage.getItem('roxten_integrations');
    if (saved) {
      const all = JSON.parse(saved);
      const updated = all.map((i: Integration) => i.id === id ? { ...i, status: 'Disconnected', lastActivity: undefined } : i);
      localStorage.setItem('roxten_integrations', JSON.stringify(updated));
    }
    router.push('/dashboard/integrations');
  };

  if (!integration) return <div className="p-8">Loading Settings...</div>;

  return (
    <div className="flex flex-col h-full bg-[#fbfbfe] overflow-hidden text-gray-900 font-sans relative">
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="p-2 mr-4 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{integration.name} Settings</h1>
          <p className="text-xs text-gray-500">Manage connection and sync preferences</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
              {integration.logoUrl ? (
                <img src={integration.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
              ) : (
                <Server className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-900">{integration.name}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${integration.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {integration.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{integration.description}</p>
              <p className="text-xs font-medium text-gray-400">Version: {integration.version}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Sync Preferences</h3>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sync Frequency</label>
                <select 
                  value={syncFreq} 
                  onChange={e => setSyncFreq(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm font-medium rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="realtime">Real-time (Webhooks)</option>
                  <option value="15m">Every 15 Minutes</option>
                  <option value="1h">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">Auto-Sync Data</p>
                  <p className="text-xs text-gray-500">Automatically pull new records</p>
                </div>
                <button 
                  onClick={() => setAutoSync(!autoSync)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSync ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Access & Scopes</h3>
              </div>
              <ul className="space-y-3">
                {integration.scopes.length > 0 ? integration.scopes.map(s => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                )) : (
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Full read/write access</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between mt-8">
            <div>
              <h3 className="font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-700 mt-1">Disconnecting will immediately halt all data syncing.</p>
            </div>
            <button 
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
            >
              <PowerOff className="w-4 h-4" /> Disconnect
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
